import { useState, FormEvent, useEffect } from "react";
import { databases, account } from "../appwrite";
import { ID } from "appwrite";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    $id: string; // Changed from id to $id to match Appwrite document format
    title: string;
    date: string;
    time: string;
  };
}

interface UserData {
  email?: string;
  name?: string;
  $id?: string;
}

async function sendMessage(subject: string, message: string, email: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject, message, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "Failed to send message");
    }
  } catch (error) {
    console.error("Messaging Error:", error);
  }
}

export default function RegistrationModal({
  isOpen,
  onClose,
  event,
}: RegistrationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create registration document with required fields matching the collection schema
      await databases.createDocument(
        import.meta.env.VITE_DATABASE_ID,
        import.meta.env.VITE_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          event: [event.$id], // Wrap the event ID in an array if the schema requires an array
          registrationDate: new Date().toISOString(), // Required datetime field
          status: "pending", // Required enum field
          userId: user?.$id || "",
        }
      );
      toast({
        title: "Registration Request Sent",
        description: "Wait For Administator Approval",
      })
      sendMessage("Registration Notification", "Your registration request has been sent!", user?.email || "");
      onClose();
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.error("Session check failed:", error);
        navigate('/login');
      }
    };
    checkSession();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for {event.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm text-gray-500 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">Event Date:</div>
                <div className="col-span-2">{event.date}</div>

                <div className="font-medium text-gray-700">Event Time:</div>
                <div className="col-span-2">{event.time}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-700">Registration Notes:</p>
              <ul className="list-disc list-inside text-gray-500 space-y-1">
                <li>
                  Your registration will be reviewed by the event administrator
                </li>
                <li>
                  You will receive a notification once your registration is
                  processed
                </li>
                <li>Please ensure you can attend before registering</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Confirm Registration"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
