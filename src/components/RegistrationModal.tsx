import { useState, FormEvent } from "react";
import { databases } from "../appwrite";
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

export default function RegistrationModal({
  isOpen,
  onClose,
  event,
}: RegistrationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
        }
      );
      toast({
        title: "Registration Request Sent",
        description: "Wait For Administator Approval",
      })
      onClose();
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
