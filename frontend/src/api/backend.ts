import Cookies from 'universal-cookie';
import { Location } from 'history';

import { toApiQuery } from '../components/pagination';
import { User, BingoCard, Category } from '../types';
import debugLog from '../debug';

// here for pasting purposes
// import api from '../api/backend';

const cookies = new Cookies();
const baseUrl = '/api';
const defaultOptions = { credentials: 'same-origin' };
const defaultHeaders = () => ({
    'X-CSRFToken' : cookies.get('csrftoken'),
});

export interface ApiResponse<T = any> {
    data: T | null;
    ok: boolean;
}

const apiGetPostPut = async <T = any>(url: string, data: object = {}, put: boolean = false): Promise<ApiResponse<T>> => {
    debugLog({ BACKEND: 1, url, data });
    let options: any = { ...defaultOptions, method: 'GET' };

    if (Object.keys(data).length > 0) {
        options = {
            ...options,
            method: put ? 'PUT' : 'POST',
            headers: {
                ...defaultHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }
    } 

    return await apiResp<T>(url, options);
};

const apiDelete = async <T = any>(url: string): Promise<ApiResponse<T>> => {
    return await apiResp<T>(url, { ...defaultOptions, method: 'DELETE', headers: {...defaultHeaders()} });
}

const apiResp = async <T = any>(url: string, options: any): Promise<ApiResponse<T>> => {
    let resp = await fetch(`${baseUrl}${url}`, options);
    let respData: T | null = null;

    try { respData = await resp.json() }
    catch {}

    return {
        data: respData,
        ok: resp.ok,
    };
}

interface VoteData {
    card: { id: number };
    up: boolean;
}

interface UserData {
    username: string;
    password: string;
    email: string;
}

interface LoginData {
    user?: User;
    valid: boolean;
}

const api = {
    login(credentials: object) {
        return apiGetPostPut<LoginData>('/login/', credentials);
    },
    logout() {
        return apiGetPostPut('/logout/');
    },

    // PUT
    editCard(cardId: number, cardData: object) {
        return apiGetPostPut(`/cards/${cardId}/`, cardData, true);
    },

    // DELETE
    deleteCard(cardId: number) {
        return apiDelete(`/cards/${cardId}/`);
    },
    
    // POST
    createUser(userData: UserData) {
        return apiGetPostPut('/signup/', userData);
    },
    createVote(voteData: VoteData) {
        return apiGetPostPut('/votes/', voteData);
    },
    createCard(cardData: object) {
        return apiGetPostPut('/cards/', cardData);
    },

    // GET
    getSession() {
        return apiGetPostPut('/session/');
    },
    getCard(cardId: string) {
        return apiGetPostPut(`/cards/${cardId}/`);
    },
    getUser(userId: string) {
        return apiGetPostPut(`/users/${userId}/`);
    },
    getCategory(categoryName: string) {
        return apiGetPostPut(`/categories/${categoryName}/`);
    },
    getCardList(location: Location, query: object = {}) {
        return apiGetPostPut(`/cards/?${toApiQuery(location, query)}`);
    },
    getTopThreeCards(name: string) {
        return apiGetPostPut<BingoCard[]>(`/bar/cards/?search=${name}`);
    },
    getTopThreeCategories(name: string) {
        return apiGetPostPut<Category[]>(`/bar/categories/?search=${name}`);
    },
};

export default api;
