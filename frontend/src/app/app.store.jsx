import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../feature/auth/auth.slice'
import itemsReducer from '../feature/dashboard/services/item.slice'
import resurfaceReducer from '../feature/resurface/services/resurface.slice'
import searchReducer from '../feature/search/services/search.slice'
import collectionsReducer from '../feature/collections/services/collections.slice'
import graphReducer from '../feature/graph/services/graph.slice'


export const store = configureStore({
    reducer:{
        auth:authReducer,
        items: itemsReducer,
        resurface:resurfaceReducer,
        search:searchReducer,
        collections:collectionsReducer,
        graph:graphReducer
    }
})