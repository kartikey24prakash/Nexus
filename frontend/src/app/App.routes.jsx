import {createBrowserRouter} from "react-router"
import Login from "../feature/auth/pages/Login"

import Protected from "../feature/auth/components/Protected"
import Register from '../feature/auth/pages/Register'
import Dashboard from '../feature/dashboard/pages/Dashboard'
import Search from "../feature/search/pages/Search"
import Ask from "../feature/rag/pages/Ask"
import Collections from "../feature/collections/pages/Collections"
import CollectionDetail from "../feature/collections/pages/Collectiondetail "
import ItemDetail from '../feature/dashboard/pages/ItemDetail'
import Graph from "../feature/graph/pages/Graph"



// import { Navigate } from "react-router";

export const router = createBrowserRouter([
    {
        path:"/login",
        element: <Login></Login>
    },
    {
        path:"/register",
        element:<Register></Register>
    },
    {
        path:"/",
        element: <Protected>
            <Dashboard></Dashboard>
        </Protected>
    },
    {
        path:"/search",
        element:<Protected>
            <Search></Search>
        </Protected>
    },
    {
        path:"/ask",
        element:<Protected>
            <Ask></Ask>
        </Protected>
    },
    {
        path:"/collections",
        element:<Protected>
            <Collections></Collections>
        </Protected>
    },
    {
        path:'/collections/:id',
        element:<Protected>
            <CollectionDetail></CollectionDetail>
        </Protected>
    },
    {
        path:'/item/:id',
        element:<Protected>
            <ItemDetail></ItemDetail>
        </Protected>
    },
    {
        path:'/graph',
        element:<Protected>
            <Graph></Graph>
        </Protected>
    }
])
