import { useEffect, useState } from "react";
import { getAgentRequestsAPI, approveAgentRequestAPI, rejectAgentRequestAPI } from "@/apis/adminAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminAgentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, requestId: null });
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined
      };
      const data = await getAgentRequestsAPI(params);
      setRequests(data.requests);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load agent requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveAgentRequestAPI(actionDialog.requestId, adminNotes);
      toast.success("Agent request approved");
      setActionDialog({ open: false, type: null, requestId: null });
      setAdminNotes("");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve request");
      console.error(error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectAgentRequestAPI(actionDialog.requestId, adminNotes);
      toast.success("Agent request rejected");
      setActionDialog({ open: false, type: null, requestId: null });
      setAdminNotes("");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject request");
      console.error(error);
    }
  };

  const openViewDialog = (request) => {
    setSelectedRequest(request);
    setViewDialog(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "bg-orange-100 text-orange-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700"
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-700"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Requests</h1>
        <p className="text-muted-foreground">Manage agent upgrade requests</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Requests</CardTitle>
            <Select value={statusFilter || "all"} onValueChange={(value) => {
              setStatusFilter(value === "all" ? "" : value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <div key={request._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src={request.userId?.avatar || '/default-avatar.png'}
                            alt={request.userId?.fullName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {request.userId?.fullName || 'Unknown User'}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {request.userId?.email}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {request.companyName && (
                                <p><span className="font-medium">Company:</span> {request.companyName}</p>
                              )}
                              {request.agentTitle && (
                                <p><span className="font-medium">Title:</span> {request.agentTitle}</p>
                              )}
                              {request.experience !== null && (
                                <p><span className="font-medium">Experience:</span> {request.experience} years</p>
                              )}
                              {request.licenseNumber && (
                                <p><span className="font-medium">License:</span> {request.licenseNumber}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Submitted: {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                            {request.reviewedAt && (
                              <p className="text-xs text-muted-foreground">
                                Reviewed: {format(new Date(request.reviewedAt), 'MMM dd, yyyy HH:mm')} 
                                {request.reviewedBy && ` by ${request.reviewedBy.fullName}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(request)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setActionDialog({ 
                                  open: true, 
                                  type: 'approve', 
                                  requestId: request._id 
                                })}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setActionDialog({ 
                                  open: true, 
                                  type: 'reject', 
                                  requestId: request._id 
                                })}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No agent requests found
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedRequest.userId?.avatar || '/default-avatar.png'}
                  alt={selectedRequest.userId?.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold">{selectedRequest.userId?.fullName}</h3>
                  <p className="text-muted-foreground">{selectedRequest.userId?.email}</p>
                  <p className="text-sm">{selectedRequest.userId?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedRequest.companyName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="font-medium">{selectedRequest.agentTitle || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Experience</Label>
                  <p className="font-medium">{selectedRequest.experience || 0} years</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">License Number</Label>
                  <p className="font-medium">{selectedRequest.licenseNumber || 'N/A'}</p>
                </div>
              </div>

              {selectedRequest.bio && (
                <div>
                  <Label className="text-muted-foreground">Bio</Label>
                  <p className="mt-1">{selectedRequest.bio}</p>
                </div>
              )}

              {selectedRequest.specializations && selectedRequest.specializations.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Specializations</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRequest.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.areasServed && selectedRequest.areasServed.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Areas Served</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRequest.areasServed.map((area, index) => (
                      <Badge key={index} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="mt-1 p-2 bg-gray-100 rounded">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => {
          setActionDialog({ open, type: null, requestId: null });
          setAdminNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Approve' : 'Reject'} Agent Request
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' 
                ? 'This user will be granted agent privileges.' 
                : 'This request will be rejected.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes about this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setActionDialog({ open: false, type: null, requestId: null });
                setAdminNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === 'approve' ? 'default' : 'destructive'}
              onClick={actionDialog.type === 'approve' ? handleApprove : handleReject}
            >
              {actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
