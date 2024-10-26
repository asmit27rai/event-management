import { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { databases, account } from "../appwrite";
import { Query } from "appwrite";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Users, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';

interface EventDocument {
  $id: string;
  title: string;
  date: string;
  Attendee: string[];
  Max_Attendees: number;
}

type RequestDocument = {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    event: string;
    eventDetails: EventDocument;
    registrationDate: string;
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
};

interface UserData {
  email?: string;
  name?: string;
  $id: string;  // Made $id required
}

const Request = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [requests, setRequests] = useState<RequestDocument[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestDocument | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const navigate = useNavigate();

  const fetchRequests = async () => {
    if (!user?.$id) {
      console.error('No user ID available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        import.meta.env.VITE_DATABASE_ID,
        import.meta.env.VITE_REQUESTS_COLLECTION_ID,
        [
          Query.orderDesc('registrationDate'),
        ]
      );
      
      const requestsWithEvents = await Promise.all(
        response.documents.map(async (request) => {
          try {
            console.log('Request event data:', {
              requestId: request.$id,
              eventData: request.event,
              eventType: typeof request.event,
              userId: request.userId || user.$id  // Use existing userId or current user's ID
            });
  
            let eventId: string;
            
            if (request.event === null || request.event === undefined) {
              throw new Error('Event ID is missing');
            }
  
            if (typeof request.event === 'string') {
              eventId = request.event;
            }
            else if (typeof request.event === 'object' && '$id' in request.event) {
              eventId = request.event.$id;
            }
            else if (typeof request.event === 'object' && 'id' in request.event) {
              eventId = request.event.id;
            }
            else if (Array.isArray(request.event) && request.event.length > 0) {
              const firstEvent = request.event[0];
              if (typeof firstEvent === 'string') {
                eventId = firstEvent;
              } else if (typeof firstEvent === 'object' && firstEvent !== null) {
                eventId = firstEvent.$id || firstEvent.id;
              } else {
                throw new Error('Invalid event array format');
              }
            }
            else if (typeof request.event === 'object') {
              const eventObj = request.event as Record<string, any>;
              const possibleId = Object.values(eventObj).find(value => 
                typeof value === 'string' && value.length <= 36
              );
              if (possibleId) {
                eventId = possibleId;
              } else {
                throw new Error('Could not find valid event ID in object');
              }
            } else {
              throw new Error('Unsupported event data format');
            }
  
            const eventResponse = await databases.getDocument(
              import.meta.env.VITE_DATABASE_ID,
              import.meta.env.VITE_EVENT_COLLECTION_ID,
              eventId
            );
  
            const requestDoc: RequestDocument = {
              ...request,
              event: eventId,
              eventDetails: {
                $id: eventResponse.$id,
                title: eventResponse.title,
                date: eventResponse.date,
                Attendee: eventResponse.Attendee || [],
                Max_Attendees: eventResponse.Max_Attendees
              },
              registrationDate: request.registrationDate,
              status: request.status,
              userId: request.userId || user.$id  // Use existing userId or current user's ID
            };
  
            return requestDoc;
          } catch (error) {
            console.error(`Error fetching event details for request ${request.$id}:`, error);
            console.debug('Failed request data:', {
              request: request,
              eventData: request.event,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
          }
        })
      );
      
      const validRequests = requestsWithEvents.filter((req): req is RequestDocument => req !== null);
      console.log(`Successfully processed ${validRequests.length} out of ${response.documents.length} requests`);
      setRequests(validRequests);
      setError(null);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await account.get();
        if (!userData.$id) {
          throw new Error('No user ID available');
        }
        setUser(userData as UserData);
      } catch (error) {
        console.error("Session check failed:", error);
        navigate('/login');
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (user?.$id) {
      fetchRequests();
    }
  }, [user]);

  const handleStatusUpdate = async (request: RequestDocument, newStatus: string) => {
    try {
      if (!user?.$id) {
        throw new Error('No user ID available');
      }

      setIsLoading(true);
      
      // Update request status
      await databases.updateDocument(
        import.meta.env.VITE_DATABASE_ID,
        import.meta.env.VITE_REQUESTS_COLLECTION_ID,
        request.$id,
        {
          status: newStatus
        }
      );

      // If approving, update event's Attendee array with the user's ID
      if (newStatus === 'approved') {
        const currentEvent = request.eventDetails;
        
        // Check if event has reached maximum capacity
        if (currentEvent.Attendee.length >= currentEvent.Max_Attendees) {
          throw new Error('Event has reached maximum capacity');
        }

        // Get the userId from the request, fallback to current user's ID
        const userId = request.userId || user.$id;
        
        if (!userId) {
          throw new Error('No valid user ID available');
        }

        // Check if user is already in the attendee list
        if (currentEvent.Attendee.includes(userId)) {
          throw new Error('User is already registered for this event');
        }
        
        // Log the update operation
        console.log('Updating event attendees:', {
          eventId: currentEvent.$id,
          userId: userId,
          currentAttendees: currentEvent.Attendee
        });

        await databases.updateDocument(
          import.meta.env.VITE_DATABASE_ID,
          import.meta.env.VITE_EVENT_COLLECTION_ID,
          currentEvent.$id,
          {
            Attendee: [...currentEvent.Attendee, userId]
          }
        );
      }

      await fetchRequests();
      setIsAlertOpen(false);
      toast({
        title: 'Request Updated',
        description: 'The request status has been successfully updated.',
      })
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update request status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openActionDialog = (request: RequestDocument, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setIsAlertOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      approved: 'bg-green-100 text-green-800 hover:bg-green-200',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return colors[status] || 'bg-gray-100';
  };

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(request => request.status === filterStatus);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchRequests} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Event Requests</h1>
          
          <Select 
            value={filterStatus} 
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.$id} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {request.eventDetails.title}
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusBadgeColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{request.eventDetails.Attendee.length}/{request.eventDetails.Max_Attendees}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(request.eventDetails.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Registered: {new Date(request.registrationDate).toLocaleDateString()}</span>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => openActionDialog(request, 'approve')}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                          disabled={request.eventDetails.Attendee.length >= request.eventDetails.Max_Attendees}
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={() => openActionDialog(request, 'reject')}
                          className="bg-red-600 hover:bg-red-700 flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' 
                ? `Are you sure you want to approve this request? This will add the attendee to the event (${selectedRequest?.eventDetails.Attendee.length}/${selectedRequest?.eventDetails.Max_Attendees} spots filled).`
                : 'Are you sure you want to reject this request?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedRequest && handleStatusUpdate(selectedRequest, actionType === 'approve' ? 'approved' : 'rejected')}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Request;