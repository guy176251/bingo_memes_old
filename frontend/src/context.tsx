import { createContext } from 'react';
import { UserState } from './types';

export const UserAuthContext = createContext<UserState>(null);
