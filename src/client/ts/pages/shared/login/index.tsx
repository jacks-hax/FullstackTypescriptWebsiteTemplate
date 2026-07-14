import 'bootstrap';
import * as React from 'react';

// Page Components
import LoginForm from '@client/components/forms/login-form';

// Utils
import ReactEventBus from '@client/utils/react-event-bus';

import AppWindow from '@models/window';
declare const window: AppWindow;

try {
    ReactEventBus.componentLoaded('/login', <LoginForm />);
} catch (error) {
    console.error(error);
}
