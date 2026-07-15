import * as React from 'react';

// Utils
import ReactEventBus from '@client/utils/react-event-bus';

// UI
import HomeScreen from './home';

ReactEventBus.componentLoaded('/', <HomeScreen />);
