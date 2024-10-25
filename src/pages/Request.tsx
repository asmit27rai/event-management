import { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { databases } from "../appwrite";
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
import { Clock, Calendar, Loader2 } from "lucide-react";
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

type RequestDocument = {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    eventDetails: EventDetails;
    event: string;  // Changed to just string since we're handling a single event
    registrationDate: string;
    status: string;
};

type EventDetails = {
    title: string;
    date: string;
};

const Request = () => {
  const [requests, setRequests] = useState<RequestDocument[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestDocument | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const fetchRequests = async () => {
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
            const eventId = typeof request.event === 'string' 
              ? request.event 
              : Array.isArray(request.event) 
                ? request.event[0] 
                : null;

            if (!eventId) {
              throw new Error('Invalid event ID');
            }

            const eventResponse = await databases.getDocument(
              import.meta.env.VITE_DATABASE_ID,
              import.meta.env.VITE_EVENT_COLLECTION_ID,
              eventId
            );

            const requestDoc: RequestDocument = {
              $id: request.$id,
              $collectionId: request.$collectionId,
              $databaseId: request.$databaseId,
              $createdAt: request.$createdAt,
              $updatedAt: request.$updatedAt,
              $permissions: request.$permissions,
              eventDetails: {
                title: eventResponse.title,
                date: eventResponse.date,
              },
              event: eventId,
              registrationDate: request.registrationDate,
              status: request.status,
            };

            return requestDoc;
          } catch (error) {
            console.error(`Error fetching event details for request ${request.$id}:`, error);
            return {
              ...request,
              eventDetails: {
                title: 'Event Not Found',
                date: 'Unknown Date',
              },
            } as RequestDocument;
          }
        })
      );
      
      setRequests(requestsWithEvents);
      setError(null);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      
      await databases.updateDocument(
        import.meta.env.VITE_DATABASE_ID,
        import.meta.env.VITE_REQUESTS_COLLECTION_ID,
        requestId,
        {
          status: newStatus
        }
      );

      if (newStatus === 'approved') {
        const request = requests.find(r => r.$id === requestId);
        if (request) {
          const attendeeId = crypto.randomUUID().replace(/-/g, '');
          
          await databases.createDocument(
            import.meta.env.VITE_DATABASE_ID,
            import.meta.env.VITE_ATTENDEES_COLLECTION_ID,
            attendeeId,
            {
              event: request.event,
              registrationDate: request.registrationDate,
              status: 'attending'
            }
          );
        }
      }

      await fetchRequests();
      setIsAlertOpen(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update request status. Please try again.');
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
                  <Badge className={getStatusBadgeColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
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
              Are you sure you want to {actionType} this request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleStatusUpdate(selectedRequest!.$id, actionType === 'approve' ? 'approved' : 'rejected')}
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