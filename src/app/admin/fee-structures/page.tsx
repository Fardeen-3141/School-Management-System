// src/app/admin/fee-structures/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Edit, Trash2, Plus, MoreVertical, CheckCircle } from "lucide-react";
import { Recurrence } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import {
  ColumnDef,
  ResponsiveList,
} from "@/components/ui/special/ResponsiveList";

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
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStructure, setSelectedStructure] =
    useState<FeeStructure | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fee-structures");
      if (response.ok) {
        const data = await response.json();
        setStructures(data);
      } else {
        setError("Failed to fetch fee structures.");
      }
    } catch (err) {
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

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
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const url = isEditing
        ? `/api/fee-structures/${selectedStructure?.id}`
        : "/api/fee-structures";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          isEditing
            ? "Fee structure updated successfully!"
            : "Fee structure created successfully!"
        );
        setIsDialogOpen(false);
        fetchFeeStructures();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(
          data.error ||
            `Failed to ${isEditing ? "update" : "create"} structure.`
        );
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (structureId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this fee structure? This cannot be undone."
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/fee-structures/${structureId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess("Fee structure deleted successfully!");
        fetchFeeStructures();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to delete structure.");
      }
    } catch {
      setError("Error deleting fee structure.");
    }
  };

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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <ResponsiveList
          columns={columns}
          data={structures}
          loading={loading}
          rowKey="id"
          emptyState={
            <div className="text-center py-8 text-gray-500">
              No fee structures found. Create one to get started.
            </div>
          }
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Fee Structure" : "Create New Fee Structure"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Fee Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  placeholder="e.g., Tuition Fee, Admission Fee"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="recurrence">Recurrence</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value: Recurrence) =>
                    setFormData((prev) => ({ ...prev, recurrence: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONCE">
                      One-Time (e.g., Admission Fee)
                    </SelectItem>
                    <SelectItem value="MONTHLY">
                      Monthly (e.g., Tuition Fee)
                    </SelectItem>
                    <SelectItem value="YEARLY">
                      Yearly (e.g., Re-admission Fee)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
                <Label htmlFor="isDefault">
                  Apply this fee to all new students by default?
                </Label>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save Structure"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
