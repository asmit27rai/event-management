import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases, storage } from "../appwrite";
import { ID, Permission, Role, Query } from "appwrite";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, PlusCircle, User, LogOut, Inbox, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const eventTypes = [
  { label: "Technology", value: "Technology" },
  { label: "Business", value: "Business" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "Sports", value: "Sports" },
  { label: "Education", value: "Education" },
];

interface FormData {
  title: string;
  date: string;
  location: string;
  description: string;
  attendeesCount: string;
  type: string;
  file?: File | null;
}

interface UserData {
  email?: string;
  name?: string;
  $id?: string;
}

interface EventData {
  title: string;
  date: string;
  location: string;
  description: string;
  type: string;
  Max_Attendees: number;
  Attendee: string[];
  bucket_id?: string;
}

export function Navbar() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const admin = import.meta.env.VITE_ADMIN_EMAIL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [pendingRequestCount, setPendingRequestCount] = useState<number>(0);

  const initialFormData: FormData = {
    title: "",
    date: "",
    location: "",
    description: "",
    attendeesCount: "",
    type: "",
    file: null,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.error("Session check failed:", error);
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (user?.email === admin) {
      fetchPendingRequestCount();
    }
  }, [user, admin]);

  const fetchPendingRequestCount = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_DATABASE_ID,
        import.meta.env.VITE_REQUESTS_COLLECTION_ID,
        [Query.equal('status', 'pending')]
      );
      setPendingRequestCount(response.total);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      toast({
        title: "Logout successful",
        description: "You have logged out successfully.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        file: e.target.files![0],
      }));
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "title",
      "date",
      "location",
      "description",
      "attendeesCount",
      "type",
    ];
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        return false;
      }
    }
    return true;
  };

  const uploadFile = async (): Promise<string | undefined> => {
    if (!formData.file) return undefined;

    try {
      const fileUpload = await storage.createFile(
        import.meta.env.VITE_EVENT_IMAGE_ID,
        ID.unique(),
        formData.file
      );

      return fileUpload.$id;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    let bucketId: string | undefined;

    try {
      if (formData.file) {
        bucketId = await uploadFile();
      }

      const eventData: EventData = {
        title: formData.title,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        description: formData.description,
        type: formData.type,
        Max_Attendees: parseInt(formData.attendeesCount),
        Attendee: [],
        ...(bucketId && { bucket_id: bucketId }),
      };

      await databases.createDocument(
        import.meta.env.VITE_DATABASE_ID,
        import.meta.env.VITE_EVENT_COLLECTION_ID,
        ID.unique(),
        eventData,
        [
          Permission.read(Role.any()),
          Permission.write(Role.user(user?.$id || "")),
          Permission.delete(Role.user(user?.$id || "")),
        ]
      );

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      setIsModalOpen(false);
      setFormData(initialFormData);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <a href="/"><span className="ml-2 text-xl font-bold">EventMaster</span></a>
            </div>
            <div className="flex items-center space-x-4">
              {admin === user?.email && (
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
              {admin === user?.email && (
                <Button onClick={() => navigate("/requests")} className="relative">
                  <Inbox className="h-4 w-4 mr-2" />
                  Requests
                  {pendingRequestCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingRequestCount}
                    </span>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.name || "User Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date and Time</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                required
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter event location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter event description"
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendeesCount">Maximum Attendees</Label>
              <Input
                id="attendeesCount"
                name="attendeesCount"
                type="number"
                required
                min="1"
                value={formData.attendeesCount}
                onChange={handleInputChange}
                placeholder="Enter maximum number of attendees"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {formData.type || "Select Event Type"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {eventTypes.map((event) => (
                    <DropdownMenuItem
                      key={event.value}
                      onClick={() => handleTypeChange(event.value)}
                    >
                      {event.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}