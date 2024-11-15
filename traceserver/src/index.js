import React, {Suspense} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './i18n/config';

ReactDOM.render(
    <React.StrictMode>
        <Suspense fallback={null}>
            <App/>
        </Suspense>,
    </React.StrictMode>,
    document.getElementById('root')
);
