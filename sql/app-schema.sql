CREATE DATABASE IF NOT EXISTS {!database};
USE {!database};

-- NOTE: Id, CreatedDate, and LastModifiedDate are not included in these definitions to avoid repetitive fields
-- SEE: bin/configure-database.ts for injection of standard fields that are applied to all objects

CREATE TABLE IF NOT EXISTS User (
    Email NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(32),
    FirstName NVARCHAR(255),
    LastName NVARCHAR(255),
    EmailVerified BOOLEAN DEFAULT FALSE,
    IsActive BOOLEAN DEFAULT TRUE,
    ActivatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;

CREATE UNIQUE INDEX IF NOT EXISTS UserEmail ON User(Email);

CREATE TABLE IF NOT EXISTS UserCredentialType (
    Value NCHAR(32) NOT NULL,
    PRIMARY KEY (Value)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS UserCredential (
    Value VARCHAR(4096) NOT NULL,
    UserId CHAR({!id_size}) NOT NULL,
    Type NCHAR(32) NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    ExpirationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT CredentialUser
        FOREIGN KEY (UserId) REFERENCES User(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CONSTRAINT UserCredentialType
        FOREIGN KEY (Type) REFERENCES UserCredentialType(Value)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS Organization (
    Name VARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS OrganizationRole (
    Name NVARCHAR(255) NOT NULL,
    Label NVARCHAR(255) NOT NULL,
    OrganizationId CHAR({!id_size}) NOT NULL,
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;

CREATE UNIQUE INDEX IF NOT EXISTS RoleNameWithinOrg ON OrganizationRole(Name, OrganizationId);

CREATE TABLE IF NOT EXISTS OrganizationUser (
    OrganizationId CHAR({!id_size}) NOT NULL,
    UserId CHAR({!id_size}) NOT NULL,
    RoleId CHAR({!id_size}) NOT NULL,
    CONSTRAINT OrganizationUserOrganization
        FOREIGN KEY (OrganizationId) REFERENCES Organization(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CONSTRAINT OrganizationUserUser
        FOREIGN KEY (UserId) REFERENCES User(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CONSTRAINT OrganizationUserRole
        FOREIGN KEY (RoleId) REFERENCES OrganizationRole(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    PRIMARY KEY (OrganizationId, UserId)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS Post (
    AuthorId CHAR(255) NOT NULL,
    Status NVARCHAR(64) NOT NULL,
    Slug NVARCHAR(64) NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Body TEXT NOT NULL,
    CONSTRAINT PostAuthor
        FOREIGN KEY (AuthorId) REFERENCES User(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;

CREATE UNIQUE INDEX IF NOT EXISTS PostSlug ON Post(Slug);

CREATE TABLE IF NOT EXISTS MenuItem (
    Status NVARCHAR(63) NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(1022) NOT NULL,
    Menu NVARCHAR(63) NOT NULL,
    IconId VARCHAR(255),
    Url VARCHAR(255),
    ParentId CHAR({!id_size}),
    CONSTRAINT ParentMenuItem
        FOREIGN KEY (ParentId) REFERENCES MenuItem(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CONSTRAINT IconFile
        FOREIGN KEY (IconId) REFERENCES File(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS File (
    FileDescriptor BIGINT UNSIGNED,
    Title NVARCHAR(255),
    Url VARCHAR(255),
    MimeType NVARCHAR(255),
    Sharing NVARCHAR(32),
    OwnerId CHAR({!id_size}),
    CONSTRAINT FileOwner
        FOREIGN KEY (OwnerId) REFERENCES User(Id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    PRIMARY KEY (Id)
) CHARACTER SET utf8mb4;