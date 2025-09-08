import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { Card, CardContent } from "../card";
import { Skeleton } from "../skeleton";
import { cn } from "@/lib/utils";

// This defines a single column for our list/table.
// 'T' is a generic type representing a single item of our data array (e.g., a Student object).
export interface ColumnDef<T> {
  // The key from the data object to access the value.
  accessorKey: keyof T | string;
  // The title that will be displayed in the table header.
  header: React.ReactNode;
  // An optional custom render function for the cell.
  // It receives the full row object so you can build complex cells (e.g., with buttons).
  cell?: (row: T) => React.ReactNode;
  // Optional: Hide this column on mobile
  hideOnMobile?: boolean;
  // Optional: Column width class for desktop
  className?: string;
}

// This defines the props for our main component.
export interface ResponsiveListProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  // A unique key for each row, like 'id'. Important for React's rendering.
  rowKey: keyof T;
  emptyState?: React.ReactNode;
  // Optional: Custom loading skeleton count
  skeletonRows?: number;
}

export function ResponsiveList<T>({
  columns,
  data,
  loading,
  rowKey,
  skeletonRows = 5,
  emptyState = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-2-2m0 0l-2 2m2-2v6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        No items found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        There are no items to display at the moment. Try adjusting your filters
        or create a new item.
      </p>
    </div>
  ),
}: ResponsiveListProps<T>) {
  const isMobile = useIsMobile();

  // Filter columns for mobile (exclude hideOnMobile columns)
  const mobileColumns = columns.filter((column) => !column.hideOnMobile);

  // --- LOADING STATE ---
  if (loading) {
    if (isMobile) {
      // Enhanced mobile skeleton with better visual hierarchy
      return (
        <div className="space-y-4">
          {[...Array(Math.min(skeletonRows, 4))].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Card header skeleton */}
                <div className="bg-muted/30 p-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>

                {/* Card content skeleton */}
                <div className="p-4 space-y-3">
                  {[...Array(Math.min(mobileColumns.length - 1, 4))].map(
                    (_, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between"
                      >
                        <Skeleton className="h-4 w-20" />
                        <Skeleton
                          className={cn(
                            "h-4",
                            j === 0 ? "w-24" : j === 1 ? "w-16" : "w-20"
                          )}
                        />
                      </div>
                    )
                  )}

                  {/* Action buttons skeleton */}
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Enhanced desktop skeleton with proper proportions
    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2">
                {columns.map((column, i) => (
                  <TableHead key={i} className="h-12 bg-muted/30">
                    <Skeleton className="h-4 w-3/4" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(skeletonRows)].map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        {j === 0 && <Skeleton className="h-3 w-3/4" />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  // --- EMPTY STATE ---
  if (data.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-8">{emptyState}</CardContent>
      </Card>
    );
  }

  // --- MOBILE VIEW ---
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => {
          // Find the primary column (usually first non-action column)
          const primaryColumn = mobileColumns[0];
          const primaryContent = primaryColumn?.cell
            ? primaryColumn.cell(item)
            : (item[primaryColumn?.accessorKey as keyof T] as React.ReactNode);

          return (
            <Card
              key={String(item[rowKey])}
              className="overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="px-3 py-2">
                {/* Card Header - Primary content */}
                <div className="bg-muted/20 p-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">{primaryContent}</div>
                    {/* Show status/badge if available */}
                    {mobileColumns.find((col) =>
                      col.accessorKey.toString().includes("status")
                    )?.cell && (
                      <div className="ml-3">
                        {mobileColumns
                          .find((col) =>
                            col.accessorKey.toString().includes("status")
                          )
                          ?.cell?.(item)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body - Other details */}
                <div className="p-4">
                  <div className="space-y-3">
                    {mobileColumns.slice(1).map((column) => {
                      // Skip actions and status columns in the details section
                      if (
                        column.accessorKey.toString().includes("action") ||
                        column.accessorKey.toString().includes("status")
                      ) {
                        return null;
                      }

                      const cellContent = column.cell
                        ? column.cell(item)
                        : (item[
                            column.accessorKey as keyof T
                          ] as React.ReactNode);

                      if (
                        cellContent === null ||
                        cellContent === undefined ||
                        cellContent === ""
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={String(column.accessorKey)}
                          className="flex items-start justify-between text-sm"
                        >
                          <span className="flex-2 font-medium text-muted-foreground min-w-0 flex-shrink-0">
                            {column.header}:
                          </span>
                          <span className="flex-2 ml-4 text-left min-w-0">
                            {cellContent}
                          </span>
                        </div>
                      );
                    })}

                    {/* Actions section */}
                    {(() => {
                      const actionColumn = mobileColumns.find((col) =>
                        col.accessorKey.toString().includes("action")
                      );
                      return (
                        actionColumn?.cell && (
                          <div className="pt-3 border-t border-border/50">
                            <div className="mobile-actions">
                              {actionColumn.cell(item)}
                            </div>
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // --- DESKTOP TABLE VIEW ---
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2">
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessorKey)}
                  className={cn(
                    "h-12 font-semibold bg-muted/30 text-muted-foreground",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={String(item[rowKey])}
                className="hover:bg-muted/50 transition-colors duration-150 border-b border-border/50"
              >
                {columns.map((column) => {
                  const cellContent = column.cell
                    ? column.cell(item)
                    : (item[column.accessorKey as keyof T] as React.ReactNode);

                  return (
                    <TableCell
                      key={String(column.accessorKey)}
                      className={cn("py-4", column.className)}
                    >
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
