import {createContext,useContext,useEffect,useState} from 'react';
import {auth} from '../services/services';
const C=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('user'))}catch{return null}});const [loading,setLoading]=useState(true);useEffect(()=>{setLoading(false)},[]);const save=d=>{localStorage.setItem('token',d.token);localStorage.setItem('user',JSON.stringify(d.user));setUser(d.user)};const login=async d=>{const r=await auth.login(d);save(r.data);return r.data};const register=async d=>{const r=await auth.register(d);save(r.data);return r.data};const logout=()=>{localStorage.removeItem('token');localStorage.removeItem('user');setUser(null)};return <C.Provider value={{user,loading,login,register,logout}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);
