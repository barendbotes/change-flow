"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getReports } from "@/actions/reports";
import { formatDate } from "@/lib/utils";

// Add this function to create test data
async function createTestData() {
  try {
    const response = await fetch("/api/test/create-test-data", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to create test data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating test data:", error);
    throw error;
  }
}

interface ReportsTableProps {
  isAdmin: boolean;
  userGroups: string[] | null;
}

interface RequestData {
  id: string;
  type: string;
  title: string;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  groupName: string | null;
  approvalStatus: string | null;
}

export function ReportsTable({ isAdmin, userGroups }: ReportsTableProps) {
  const [reports, setReports] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Only admin can select "all" groups
      const groupFilter =
        !isAdmin || selectedGroup !== "all"
          ? selectedGroup !== "all"
            ? [selectedGroup]
            : userGroups
          : null;

      const result = await getReports({
        groups: groupFilter,
        type: selectedType !== "all" ? selectedType : null,
        searchTerm: searchTerm || null,
      });

      // Transform the data to ensure it matches the RequestData type
      const transformedData = Array.isArray(result.data)
        ? result.data.map((item) => ({
            id: item.id,
            type: item.type || "Unknown",
            title: item.title,
            status: item.status,
            createdBy: item.createdBy || null,
            createdAt: new Date(item.createdAt),
            groupName: item.groupName || null,
            approvalStatus: item.approvalStatus || null,
          }))
        : [];

      setReports(transformedData);

      // Set available groups for filtering
      if (isAdmin && result.availableGroups) {
        setGroups(result.availableGroups);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, userGroups, selectedGroup, selectedType, searchTerm]);

  const filteredReports = Array.isArray(reports)
    ? reports.filter((report) => {
        // Type filtering
        if (selectedType !== "all" && report.type !== selectedType)
          return false;

        // Search filtering (case insensitive)
        if (
          searchTerm &&
          !report.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
    : [];

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="w-full md:w-64">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="change">Change Request</SelectItem>
              <SelectItem value="asset">Asset Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="w-full md:w-64">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {loading
              ? "Loading reports..."
              : `Total ${filteredReports.length} reports`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Approval Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <div className="flex flex-col items-center gap-4">
                    <p>No reports found. Try adjusting your filters.</p>
                    {isAdmin && (
                      <Button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            await createTestData();
                            alert("Test data created successfully!");
                            // Refresh the data
                            fetchData();
                          } catch (error) {
                            alert("Failed to create test data.");
                            console.error(error);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Create Test Data
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.type}</TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{report.status}</TableCell>
                  <TableCell>{report.groupName}</TableCell>
                  <TableCell>{report.createdBy}</TableCell>
                  <TableCell>{formatDate(report.createdAt)}</TableCell>
                  <TableCell>{report.approvalStatus}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
