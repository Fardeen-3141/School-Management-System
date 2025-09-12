// src/app/admin/fee-structures/page.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  CheckCircle,
  DollarSign,
  X,
  AlertCircle,
  CreditCard,
  Calendar,
  Settings,
} from "lucide-react";
import { Recurrence } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";
import {
  useFeeStructureStore,
  FeeStructureData,
} from "@/stores/useFeeStructureStore";

interface FeeStructure {
  id: string;
  type: string;
  amount: number;
  recurrence: Recurrence;
  isDefault: boolean;
}

const recurrenceLabel: { [key in Recurrence]: string } = {
  ONCE: "One-Time",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export default function AdminFeeStructuresPage() {
  const {
    feeStructures,
    loading,
    error: storeError,
    fetchFeeStructures,
    addFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
  } = useFeeStructureStore();

  // Local UI state
  const [uiError, setUiError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedStructure, setSelectedStructure] =
    React.useState<FeeStructure | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    type: "",
    amount: "",
    recurrence: "ONCE" as Recurrence,
    isDefault: false,
  });

  const columns: ColumnDef<FeeStructure>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ type }) => <span className="font-medium">{type}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ amount }) => (
        <span className="font-medium">₹{Number(amount).toLocaleString()}</span>
      ),
      className: "w-[100px]",
    },
    {
      accessorKey: "recurrence",
      header: "Recurrence",
      cell: ({ recurrence }) => (
        <Badge variant="secondary">{recurrenceLabel[recurrence]}</Badge>
      ),
    },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ isDefault }) =>
        isDefault ? (
          <Badge>
            <CheckCircle className="h-4 w-4 mr-2" /> Yes
          </Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        ),
      className: "w-[100px]",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (structure) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer h-9 px-3"
            >
              <span className="hidden sm:inline mr-2">Actions</span>
              <MoreVertical className="h-4 w-4 sm:hidden" />
              <span className="sm:hidden ml-1 text-xs">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => openEditDialog(structure)}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(structure.id)}
              className="text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[100px]",
    },
  ];

  React.useEffect(() => {
    fetchFeeStructures();
  }, [fetchFeeStructures]);

  const resetForm = () => {
    setFormData({
      type: "",
      amount: "",
      recurrence: "ONCE",
      isDefault: false,
    });
    setIsEditing(false);
    setSelectedStructure(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (structure: FeeStructure) => {
    setSelectedStructure(structure);
    setFormData({
      type: structure.type,
      amount: String(structure.amount),
      recurrence: structure.recurrence,
      isDefault: structure.isDefault,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError("");
    setSuccess("");
    setFormLoading(true);

    const data: FeeStructureData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    try {
      if (isEditing && selectedStructure) {
        await updateFeeStructure(selectedStructure.id, data);
        setSuccess("Fee structure updated successfully!");
      } else {
        await addFeeStructure(data);
        setSuccess("Fee structure created successfully!");
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setUiError((err as Error).message);
      fetchFeeStructures({ force: true }); // Rollback on error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (structureId: string) => {
    if (!confirm("Are you sure...")) return;
    setUiError("");
    setSuccess("");

    try {
      await deleteFeeStructure(structureId);
      setSuccess("Fee structure deleted successfully!");
    } catch (err) {
      setUiError((err as Error).message);
      fetchFeeStructures({ force: true }); // Rollback on error
    }
  };

  const finalError = uiError || storeError;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Fee Structures</h1>
            <p className="text-gray-600">
              Define templates for all types of school fees.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Create Structure
          </Button>
        </div>

        {finalError && (
          <Alert variant="destructive">
            <AlertDescription>{finalError}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <ResponsiveList
          columns={columns}
          data={feeStructures}
          loading={loading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              No fee structures found. Create one to get started.
            </div>
          }
        />

        {/* Add/Edit Fee Structure Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <DialogHeader className="space-y-0">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  {isEditing
                    ? "Edit Fee Structure"
                    : "Create New Fee Structure"}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing
                    ? "Update fee structure details"
                    : "Set up a new fee structure for students"}
                </p>
              </DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6">
              {/* Error Alert */}
              {finalError && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {finalError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6 pb-6">
                {/* Fee Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    Fee Type *
                  </Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                    placeholder="e.g., Tuition Fee, Admission Fee, Library Fee"
                    className="h-11"
                    required
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label
                    htmlFor="amount"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    Amount *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="h-11 pl-8 text-right"
                      required
                    />
                  </div>
                </div>

                {/* Recurrence */}
                <div className="space-y-2">
                  <Label
                    htmlFor="recurrence"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Recurrence *
                  </Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrence: value as Recurrence,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 cursor-pointer hover:bg-gray-50 transition-colors">
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE" className="cursor-pointer py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">One-Time</span>
                          <span className="text-xs text-gray-500">
                            e.g., Admission Fee, Registration Fee
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="MONTHLY"
                        className="cursor-pointer py-3"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Monthly</span>
                          <span className="text-xs text-gray-500">
                            e.g., Tuition Fee, Transportation Fee
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="YEARLY"
                        className="cursor-pointer py-3"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Yearly</span>
                          <span className="text-xs text-gray-500">
                            e.g., Re-admission Fee, Annual Fee
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Setting */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Settings className="h-4 w-4 text-gray-500" />
                    Default Setting
                  </Label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="isDefault"
                          checked={formData.isDefault}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              isDefault: checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="isDefault"
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          Apply to all new students
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-9">
                        When enabled, this fee will be automatically assigned to
                        all newly enrolled students
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-gray-100 p-6 pt-4 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 px-6"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    formLoading ||
                    !formData.type ||
                    !formData.amount ||
                    !formData.recurrence
                  }
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {formLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : isEditing ? (
                    "Update Structure"
                  ) : (
                    "Create Structure"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
