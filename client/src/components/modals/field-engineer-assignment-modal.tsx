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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User } from "@shared/schema";
import { CheckCircle, X } from "lucide-react";

const assignmentSchema = z.object({
  fieldEngineerIds: z.array(z.string()).min(1, "At least one field engineer must be selected"),
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
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      fieldEngineerIds: [],
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
      return await apiRequest("POST", `/api/tasks/${taskId}/assign-multiple-field-engineers`, { 
        fieldEngineerIds: data.fieldEngineerIds 
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment Successful",
        description: `Task has been assigned to ${selectedEngineers.length} field engineer(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      form.reset();
      setSelectedEngineers([]);
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
        description: "Failed to assign task to field engineer(s)",
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
    setSelectedEngineers([]);
    onClose();
  };

  const handleEngineerSelection = (engineerId: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedEngineers, engineerId];
    } else {
      newSelection = selectedEngineers.filter(id => id !== engineerId);
    }
    
    setSelectedEngineers(newSelection);
    form.setValue("fieldEngineerIds", newSelection);
  };

  const getEngineerAvailabilityStatus = (engineer: User) => {
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

  // Get selected engineer names for summary
  const selectedEngineerNames = (fieldEngineers as User[])
    .filter(engineer => selectedEngineers.includes(engineer.id))
    .map(engineer => `${engineer.firstName} ${engineer.lastName}`);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Assign Field Engineers</DialogTitle>
          <p className="text-sm text-gray-300">
            Task: {taskTitle}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Region Filter */}
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Filter by Region</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setSelectedRegion(value);
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="">All Regions</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region || ""}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Engineers Selection */}
            <div className="space-y-4">
              <FormLabel className="text-gray-300">Field Engineers</FormLabel>
              
              {engineersLoading ? (
                <div className="text-center py-4 text-gray-400">
                  Loading engineers...
                </div>
              ) : (fieldEngineers as User[]).length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  No field engineers available
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(fieldEngineers as User[]).map((engineer: User) => (
                    <Card key={engineer.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={engineer.id}
                            checked={selectedEngineers.includes(engineer.id)}
                            onCheckedChange={(checked) =>
                              handleEngineerSelection(engineer.id, checked as boolean)
                            }
                            className="border-slate-500 text-white"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <label
                                  htmlFor={engineer.id}
                                  className="text-sm font-medium text-white cursor-pointer"
                                >
                                  {engineer.firstName} {engineer.lastName}
                                </label>
                                <p className="text-xs text-gray-400">
                                  {engineer.department || "No region"} • {engineer.email}
                                </p>
                              </div>
                              <Badge 
                                variant={getEngineerBadgeVariant(engineer)}
                                className={engineer.isActive ? 
                                  "bg-green-600/20 text-green-300 border-green-500/30" : 
                                  "bg-yellow-600/20 text-yellow-300 border-yellow-500/30"
                                }
                              >
                                {getEngineerAvailabilityStatus(engineer)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Engineers Summary */}
            {selectedEngineers.length > 0 && (
              <Card className="bg-purple-600/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-purple-300">
                      Selected Engineers ({selectedEngineers.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEngineerNames.map((name, index) => (
                      <Badge 
                        key={index}
                        className="bg-purple-600/30 text-purple-200 border-purple-500/50"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                  {selectedEngineers.length > 1 && (
                    <p className="text-xs text-purple-300 mt-2">
                      Multiple tasks will be created automatically (Task_1, Task_2, etc.)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={assignMutation.isPending || selectedEngineers.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {assignMutation.isPending ? "Assigning..." : `Assign to ${selectedEngineers.length} Engineer(s)`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}