import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Access from "./Access";
import TraceComponent from "./TraceComponent";
import TraceItem from "./TraceItem";

export default function App() {
    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/item/:warehouse/:product/:lot" element={<TraceItem/>}/>
                    {/*<Route path="/lookups/:lookup_id/edit" element={<EditLookup/>}/>*/}
                    {/*<Route path="/lookups/new" element={<NewLookup/>}/>*/}
                    {/*<Route path="/lookups" element={<LookupsScreen/>}/>*/}
                    {/*<Route path="/settings" element={<Settings/>}/>*/}
                    {/*<Route path="/lookup_dbs/:lookup_db_id/edit" element={<EditLookupDB/>}/>*/}
                    {/*<Route path="/lookup_dbs/new" element={<NewLookupDB/>}/>*/}
                    {/*<Route path="/lookup_dbs" element={<LookupDbsScreen/>}/>*/}
                    <Route path="/access/:access_token/:backend_db_name" element={<Access/>}/>
                    {/*<Route path="/admin_access/:access_token/:backend_db_name" element={<AdminAccess/>}/>*/}
                    <Route path="/" element={<TraceComponent/>}/>
                </Routes>
            </div>
        </Router>
    );
}
