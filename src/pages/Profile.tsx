import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail } from "lucide-react";
import { account } from "@/appwrite";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

interface UserData {
  email?: string;
  name?: string;
  $id?: string;
}

const Profile = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await account.get();
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error("Session check failed:", error);
        navigate('/login');
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-lg mx-auto p-6 shadow-lg rounded-lg bg-white">
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="ml-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
    <Navbar />
    <Card className="w-full max-w-lg mx-auto p-8 shadow-xl rounded-xl bg-gradient-to-r from-white to-gray-100 mt-6">
      <CardHeader className="pb-4 border-b border-gray-200 text-center">
        <Avatar className="h-20 w-20 mx-auto shadow-md">
          <AvatarFallback className="text-xl font-bold bg-gray-200 text-gray-600">
            {user?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="mt-4 text-2xl font-semibold text-gray-800">{user?.name}</CardTitle>
      </CardHeader>

      <CardContent className="mt-6 text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Mail className="h-5 w-5 text-gray-500" />
          <span>{user?.email}</span>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default Profile;