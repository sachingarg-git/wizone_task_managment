import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User } from "@shared/schema";

const assignmentSchema = z.object({
  fieldEngineerId: z.string().min(1, "Field engineer selection is required"),
  region: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface FieldEngineerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskTitle: string;
}

export default function FieldEngineerAssignmentModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
}: FieldEngineerAssignmentModalProps) {
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      fieldEngineerId: "",
      region: "",
    },
  });

  // Fetch field engineers
  const { data: fieldEngineers = [], isLoading: engineersLoading } = useQuery({
    queryKey: ["/api/field-engineers", selectedRegion],
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      return await apiRequest("POST", `/api/tasks/${taskId}/assign-field-engineer`, { 
        fieldEngineerId: data.fieldEngineerId 
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment Successful",
        description: "Task has been assigned to field engineer",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Assignment Failed",
        description: "Failed to assign task to field engineer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    assignMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setSelectedRegion("");
    onClose();
  };

  const getEngineerAvailabilityStatus = (engineer: User) => {
    // This would typically come from real availability data
    // For now, we'll show a simple active/inactive status
    return engineer.isActive ? "Available" : "Busy";
  };

  const getEngineerBadgeVariant = (engineer: User) => {
    return engineer.isActive ? "default" : "secondary";
  };

  // Get unique regions from engineers
  const regions = Array.from(
    new Set(
      (fieldEngineers as User[])
        .map((engineer: User) => engineer.department)
        .filter(Boolean)
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Field Engineer</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Task: {taskTitle}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Region Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Region</label>
              <Select
                value={selectedRegion}
                onValueChange={(value) => setSelectedRegion(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {regions.map((region: string | null) => (
                    <SelectItem key={region || 'no-region'} value={region || 'no-region'}>
                      {region || 'No Region'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Engineer Selection */}
            <FormField
              control={form.control}
              name="fieldEngineerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Engineer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={engineersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          engineersLoading 
                            ? "Loading engineers..." 
                            : "Select a field engineer"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(fieldEngineers as User[]).map((engineer: User) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {engineer.firstName} {engineer.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {engineer.department || "No region"}
                              </span>
                            </div>
                            <Badge 
                              variant={getEngineerBadgeVariant(engineer)}
                              className="ml-2"
                            >
                              {getEngineerAvailabilityStatus(engineer)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      {(fieldEngineers as User[]).length === 0 && !engineersLoading && (
                        <SelectItem value="no-engineers" disabled>
                          No field engineers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Engineer Details */}
            {form.watch("fieldEngineerId") && (
              <div className="p-3 bg-muted rounded-lg">
                {(() => {
                  const selectedEngineer = (fieldEngineers as User[]).find(
                    (e: User) => e.id === form.watch("fieldEngineerId")
                  );
                  if (!selectedEngineer) return null;
                  
                  return (
                    <div className="space-y-2">
                      <h4 className="font-medium">Selected Engineer Details</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {selectedEngineer.firstName} {selectedEngineer.lastName}</p>
                        <p><strong>Email:</strong> {selectedEngineer.email}</p>
                        <p><strong>Region:</strong> {selectedEngineer.department || "Not specified"}</p>
                        <p><strong>Status:</strong> 
                          <Badge variant={getEngineerBadgeVariant(selectedEngineer)} className="ml-1">
                            {getEngineerAvailabilityStatus(selectedEngineer)}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={assignMutation.isPending || !form.watch("fieldEngineerId")}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}