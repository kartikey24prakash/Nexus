import { useDispatch } from "react-redux";
import { login, register, getMe, logout } from "../services/auth.api";
import { setUser, clearUser, setLoading, setError, setChecked } from "../auth.slice";

export function useAuth() {
    const dispatch = useDispatch()

    async function handleRegister({ name, email, password }) {
        try {
            dispatch(setLoading(true))
            const data = await register({ name, email, password })
            dispatch(setUser(data.user))
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Registration failed"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true))
            const data = await login({ email, password })
            dispatch(setUser(data.user))
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Login failed"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleGetMe() {
        try {
            dispatch(setLoading(true))
            const data = await getMe()
            dispatch(setUser(data.user))
        } catch (err) {
            dispatch(setUser(null))
        } finally {
            dispatch(setLoading(false))
            dispatch(setChecked(true))
        }
    }

    async function handleLogout() {
        try {
            dispatch(setLoading(true))
            await logout()
            dispatch(clearUser())
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Logout failed"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe,
        handleLogout,
    }
}