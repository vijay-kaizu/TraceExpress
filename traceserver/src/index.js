import React, {Suspense} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/config';
import * as serviceWorker from "./serviceWorker";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <Suspense fallback={null}>
            <App/>
        </Suspense>
    </React.StrictMode>
);

serviceWorker.unregister();
