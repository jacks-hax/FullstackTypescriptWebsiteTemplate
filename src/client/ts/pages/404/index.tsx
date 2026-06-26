import 'bootstrap';
import * as React from 'react';

// Utils
import ReactUtils from '@client/utils/react';

try {
    // Get the slot where the form needs to go, and ensure it exists
    const root = ReactUtils.createRoot('root');

    // Render the ContactSales form component
    root.render(
        <>
            <div className='card p-4'>
                <h1>404</h1>
                <div className='row g-3'>Page Not Found</div>
            </div>
        </>
    );
} catch (error) {
    console.error(error);
}
