import { useContext, useState, useEffect, createContext } from "react";
import { useHistory } from "react-router-dom";
import { UserState } from "./types";
import api, { ApiResponse } from "./api/backend";
import debugLog from "./debug";

type AuthCallback = (resp: ApiResponse) => void;

interface LoginProps {
    credentials: object;
    callback?: AuthCallback;
}

interface LogoutProps {
    callback?: AuthCallback;
}

interface AuthData {
    user: UserState;
    login: (props: LoginProps) => Promise<void>;
    logout: (props: LogoutProps) => Promise<void>;
    getSession: () => Promise<void>;
    ifAuth: (callback: () => void) => void;
}

export const AuthContext = createContext<AuthData>({
    user: null,
    async login(props: LoginProps) {},
    async logout(props: LogoutProps) {},
    async getSession() {},
    ifAuth(callback: () => void) {},
});

const useProvideAuth = () => {
    const [user, setUser] = useState<UserState>(null);
    const history = useHistory();

    return {
        user,
        async login({ credentials, callback }: LoginProps) {
            let { data, ok } = await api.login(credentials);
            if (ok && data && data.user) setUser(data.user);
            callback && callback({ data, ok });
        },
        async logout({ callback }: LogoutProps) {
            let { data, ok } = await api.logout();
            if (ok) setUser(null);
            callback && callback({ data, ok });
        },
        async getSession() {
            let { data, ok } = await api.getSession();
            if (ok && data && data.user) setUser(data.user);
        },
        ifAuth(callback: () => void) {
            if (user) {
                callback();
            } else {
                debugLog({ IFAUTH: "redirect to login" });
                history.push("/login/");
            }
        },
    };
};

export const ProvideAuth = ({ children }: { children: any }) => {
    const auth = useProvideAuth();

    useEffect(() => {
        auth.getSession();
    }, []);

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
