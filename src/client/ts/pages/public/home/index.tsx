import 'bootstrap';
import * as React from 'react';

// Utils
import ReactUtils from '@client/utils/react';
import HomeScreen from './home';

try {
    const root = ReactUtils.createRoot('root');
    root.render(<HomeScreen />);
} catch (error) {
    console.error(error);
}
