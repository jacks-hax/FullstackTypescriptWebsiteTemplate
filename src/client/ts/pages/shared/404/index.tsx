import 'bootstrap';
import * as React from 'react';

// Utils
import ReactEventBus from '@client/utils/react-event-bus';

async () => {
    try {
        const cmp = (
            <>
                <div className='card p-4'>
                    <h1>404</h1>
                    <div className='row g-3'>Page Not Found</div>
                </div>
            </>
        );
        ReactEventBus.componentLoaded('/404', cmp);
    } catch (error) {
        console.error(error);
    }
};
