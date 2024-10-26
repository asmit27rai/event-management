import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases } from "../appwrite";
import { ID, Permission, Role } from "appwrite";
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
import { Calendar, PlusCircle, Bell, User, LogOut, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Updated event types to match database enum values exactly
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
}

export function Navbar() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const admin = import.meta.env.VITE_ADMIN_EMAIL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialFormData: FormData = {
    title: "",
    date: "",
    location: "",
    description: "",
    attendeesCount: "",
    type: "",
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const eventData: EventData = {
        title: formData.title,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        description: formData.description,
        type: formData.type,
        Max_Attendees: parseInt(formData.attendeesCount),
        Attendee: [],
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

      setIsModalOpen(false);
      setFormData(initialFormData);
      console.log("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>New event registration</DropdownMenuItem>
                  <DropdownMenuItem>Upcoming event reminder</DropdownMenuItem>
                  <DropdownMenuItem>Event update: Venue changed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  {admin === user?.email && (
                    <DropdownMenuItem onClick={() => navigate("/requests")}>
                      <Inbox className="h-4 w-4 mr-2" />
                      Requests
                    </DropdownMenuItem>
                  )}
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

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}