import { createContext, useContext, useState } from "react";
import axios from 'axios'
import { server } from "../main";
import toast, {Toaster} from 'react-hot-toast';
import { useEffect } from "react";

const UserContext = createContext();

// Mock user data for local development
const mockUser = {
  _id: "mock-user-1",
  name: "Local Test User",
  email: "test@local.dev",
  role: "admin",
  createdAt: new Date().toISOString()
};

export const UserContextProvider = ({children})=>{
    const[user,setUser]=useState([])
    const[isAuth, setIsAuth]=useState(false)
    const [btnLoading, setBtnLoading]=useState(false);
    const [loading, setLoading] = useState(true);
    const [isLocalMode, setIsLocalMode] = useState(false);

    async function loginUser(email,password,navigate,fetchMyCourse) {
        setBtnLoading(true)
        try{
            const { data }= await axios.post(`${server}/api/user/login`,{
                email,
                password,
            });

            toast.success(data.message);
            localStorage.setItem("token",data.token);
            setUser(data.user);
            setIsAuth(true);
            setBtnLoading(false);
            navigate("/");
            fetchMyCourse();
        } catch(error){
            console.log(error);
            setBtnLoading(false);
            
            // If we're using local backend without user endpoints
            if (error.response && error.response.status === 404) {
                console.log("Using mock user for local development");
                toast.success("Logged in with local test user");
                localStorage.setItem("token", "mock-token-for-local-development");
                setUser(mockUser);
                setIsAuth(true);
                setIsLocalMode(true);
                navigate("/");
                fetchMyCourse();
                return;
            }
            
            setIsAuth(false);
            toast.error(error.response?.data?.message || "Login failed");
        }  
    }
    
    async function registerUser(name, email, password, navigate) {
      setBtnLoading(true);
      try {
        const { data } = await axios.post(`${server}/api/user/register`, {
          name,
          email,
          password,
        });
  
        toast.success(data.message);
        localStorage.setItem("activationToken", data.activationToken);
        setBtnLoading(false);
        navigate("/verify");
      } catch (error) {
        console.log(error);
        setBtnLoading(false);
        
        // If we're using local backend without user endpoints
        if (error.response && error.response.status === 404) {
            console.log("Using mock registration for local development");
            toast.success("Account created with local test user");
            localStorage.setItem("activationToken", "mock-token-for-local-development");
            setBtnLoading(false);
            navigate("/verify");
            return;
        }
        
        toast.error(error.response?.data?.message || "Registration failed");
      }
    }
    
    async function verifyOtp(otp, navigate) {
      const activationToken = localStorage.getItem("activationToken");
      try {
        const { data } = await axios.post(`${server}/api/user/verify`, {
          otp,
          activationToken,
        });
  
        toast.success(data.message);
        navigate("/login");
        localStorage.clear();
      } catch (error) {
        console.log(error);
        
        // If we're using local backend without user endpoints
        if (error.response && error.response.status === 404) {
            console.log("Using mock verification for local development");
            toast.success("Account verified successfully");
            navigate("/login");
            localStorage.clear();
            return;
        }
        
        toast.error(error.response?.data?.message || "Verification failed");
      }
    }

    async function fetchUser() {
        try {
          // Check if we're already in local mode from a previous login
          const localToken = localStorage.getItem("token");
          if (localToken === "mock-token-for-local-development") {
            console.log("Using mock user for local development");
            setUser(mockUser);
            setIsAuth(true);
            setIsLocalMode(true);
            setLoading(false);
            return;
          }
          
          const { data } = await axios.get(`${server}/api/user/me`, {
            headers: {
              token: localStorage.getItem("token"),
            },
          });
    
          setIsAuth(true);
          setUser(data.user);
          setLoading(false);
        } catch (error) {
          console.log(error);
          
          // If we're using local backend without user endpoints
          if (error.response && error.response.status === 404) {
            console.log("Using mock user for local development");
            // Only use mock data if we have a token stored
            if (localStorage.getItem("token")) {
              setUser(mockUser);
              setIsAuth(true);
              setIsLocalMode(true);
            }
          }
          
          setLoading(false);
        }
      }
      
      useEffect(() => {
        fetchUser();
      }, []);

    return( <UserContext.Provider value ={{user, setUser, setIsAuth, isAuth, loginUser, btnLoading, loading, registerUser, verifyOtp, fetchUser, isLocalMode}}>
        {children}
        <Toaster/>
        </UserContext.Provider>
    );
};

export const UserData = () =>  useContext(UserContext);