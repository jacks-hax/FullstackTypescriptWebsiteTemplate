import { DatabaseError } from '@database/models/errors';
import BaseModel from '@database/models/base';
import AsyncModule from '@utils/async-module';
import Constants from '@constants/shared';
import mysql from 'mysql2';

export class TransactionError extends Error {
    transactionInitError?: mysql.QueryError;
    commitError?: mysql.QueryError;
    rollbackError?: mysql.QueryError;
}

export type TransactionFunction = (transaction: DatabaseTransaction) => Promise<any> | any;

export default class Database extends AsyncModule {
    public static readonly CONNECTED_STATES: Set<mysql.ConnectionState> = new Set(['authenticated', 'connected']);
    public static readonly DISCONNECTED_STATES: Set<mysql.ConnectionState> = new Set(['disconnected', 'error']);

    public static pool: mysql.Pool;

    static {
        Database.init();
    }

    private static async init(): Promise<void> {
        try {
            await this.signalInit();
            Database.pool = mysql.createPool({
                host: process.env.MYSQL_HOST,
                database: process.env.MYSQL_DATABASE,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                waitForConnections: true,
                enableKeepAlive: true,
                connectionLimit: 10,
                idleTimeout: 10000,
                queueLimit: 0,
                maxIdle: 5
            });
            this.signalReady();
        } catch (error) {
            this.signalError(error as Error);
        }
    }

    public static async getConnection(): Promise<mysql.PoolConnection> {
        return new Promise<mysql.PoolConnection>((resolve, reject) => {
            Database.pool.getConnection((error: NodeJS.ErrnoException | null, connection: mysql.PoolConnection) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    /**
     * @description Wrap a function or promise in a SQL transaction
     * @param fn Function to call
     */
    public static async wrap(fn: TransactionFunction): Promise<any> {
        const connection: mysql.PoolConnection = await Database.getConnection();
        return new Promise<any>((resolve, reject) => {
            connection.beginTransaction(async (transactionInitError: mysql.QueryError | null) => {
                if (transactionInitError) {
                    const error = new TransactionError();
                    error.transactionInitError = transactionInitError;
                    reject(error);
                    connection.destroy();
                    return;
                }
                try {
                    const transaction = new DatabaseTransaction(connection);
                    const result = await fn(transaction);
                    transaction
                        .commit()
                        .then(() => resolve(result))
                        .catch(reject);
                } catch (exception) {
                    console.error(exception);
                    const error = new TransactionError();
                    if (exception instanceof Error) {
                        error.message = exception.message;
                        error.stack = exception.stack;
                    }
                    connection.rollback((rollbackError) => {
                        if (rollbackError) {
                            error.rollbackError = rollbackError;
                        }
                        reject(error);
                    });
                } finally {
                    connection.destroy();
                }
            });
        });
    }

    /**
     * @description Execute a SQL query
     * @param query SQL query string
     * @returns Promise that resolves to an array of records resulting from query
     */
    public static async query(
        query: string,
        variables: any[] = [],
        connection?: mysql.PoolConnection
    ): Promise<Array<Record<string, any>>> {
        const isSingular = !connection;
        if (!connection) {
            connection = await Database.getConnection();
        }
        return new Promise<Array<Record<string, any>>>((resolve, reject) => {
            const formattedQuery = connection.format(query, variables);
            console.log('Formatted Query:', formattedQuery);
            connection.query(
                formattedQuery,
                (
                    queryError: mysql.QueryError | null,
                    result: Array<mysql.RowDataPacket>,
                    _: Array<mysql.FieldPacket>
                ) => {
                    if (isSingular) {
                        connection.destroy();
                    }
                    if (queryError) {
                        reject(new DatabaseError(queryError));
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    /**
     * @description Insert a record
     * @param record Record to insert
     * @returns New Record ID
     */
    public static async insert(record: BaseModel, connection?: mysql.PoolConnection): Promise<string> {
        if (record.Id) {
            throw new Error(`Record already has ID: ${record.Id}`);
        }
        const isSingular = !connection;
        if (!connection) {
            connection = await Database.getConnection();
        }
        return new Promise<string>((resolve, reject) => {
            const recordId = record.generateId();
            const table = record.constructor.name;
            const recordClone = record.createQuerySafeClone() as unknown as Record<string, unknown>;
            const query = mysql.format('INSERT INTO ?? SET ?;', [table, recordClone]);
            console.log('Insert query:', query);
            connection.query(
                query,
                (insertError: mysql.QueryError | null, _: mysql.QueryResult, __: Array<mysql.FieldPacket>) => {
                    if (isSingular) {
                        connection.destroy();
                    }
                    if (insertError) {
                        reject(new DatabaseError(insertError));
                    } else {
                        resolve(recordId);
                    }
                }
            );
        });
    }

    public static async update(record: BaseModel, connection?: mysql.PoolConnection): Promise<mysql.ResultSetHeader> {
        if (!record?.Id) {
            throw new DatabaseError(Constants.ERROR_MESSAGES.CANNOT_UPDATE_RECORD_WITHOUT_ID);
        }
        const isSingular = !connection;
        if (!connection) {
            connection = await Database.getConnection();
        }
        const table = record.constructor.name;
        const recordClone = record.createQuerySafeClone() as unknown as Record<string, unknown>;
        const query = mysql.format('UPDATE ?? SET ? WHERE Id = ?', [table, recordClone, record.Id]);
        console.log('Update query:', query);
        return new Promise<mysql.ResultSetHeader>((resolve, reject) => {
            connection.query(
                query,
                (updateError: mysql.QueryError | null, result: mysql.ResultSetHeader, _: Array<mysql.FieldPacket>) => {
                    if (isSingular) {
                        connection.destroy();
                    }
                    if (updateError) {
                        reject(new DatabaseError(updateError));
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    public static async delete(
        record: BaseModel | string,
        connection?: mysql.PoolConnection
    ): Promise<mysql.ResultSetHeader> {
        const recordId = record instanceof BaseModel ? record.Id : record;
        if (!recordId?.length) {
            throw new DatabaseError(Constants.ERROR_MESSAGES.CANNOT_DELETE_RECORD_WITHOUT_ID);
        }
        const isSingular = !connection;
        if (!connection) {
            connection = await Database.getConnection();
        }
        const table = record.constructor.name;
        const id = recordId;
        const query = mysql.format('DELETE FROM ?? WHERE Id = ?;', [table, id]);
        console.log('Delete query:', query);
        return new Promise<mysql.ResultSetHeader>((resolve, reject) => {
            connection.query(
                query,
                (deleteError: mysql.QueryError | null, result: mysql.ResultSetHeader, _: Array<mysql.FieldPacket>) => {
                    if (isSingular) {
                        connection.destroy();
                    }
                    if (deleteError) {
                        reject(new DatabaseError(deleteError));
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }
}

export class DatabaseTransaction {
    private connection: mysql.PoolConnection;
    private isOpen: boolean = true;
    constructor(connection: mysql.PoolConnection) {
        this.connection = connection;
    }
    public query(query: string, variables: Array<string> = []): Promise<Array<Record<string, any>>> {
        this.checkState();
        return Database.query(query, variables, this.connection);
    }

    public insert(record: BaseModel): Promise<string> {
        this.checkState();
        return Database.insert(record, this.connection);
    }
    public update(record: BaseModel): Promise<mysql.ResultSetHeader> {
        this.checkState();
        return Database.update(record, this.connection);
    }
    public delete(record: BaseModel | string): Promise<mysql.ResultSetHeader> {
        this.checkState();
        return Database.delete(record, this.connection);
    }
    public commit(): Promise<void> {
        this.checkState();
        return new Promise<void>((resolve, reject) => {
            this.connection.commit((commitError) => {
                if (commitError) {
                    const error = new TransactionError();
                    error.commitError = commitError;
                    this.connection.rollback((rollbackError) => {
                        if (rollbackError) {
                            error.rollbackError = rollbackError;
                        }
                        reject(error);
                    });
                } else {
                    resolve();
                }
                this.connection.destroy();
                this.isOpen = false;
            });
        });
    }
    private checkState() {
        if (!this.isOpen) {
            throw new TransactionError('Transaction is closed.');
        }
    }
}
