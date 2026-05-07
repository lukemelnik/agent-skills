---
name: tanstack-table
description: TanStack Table patterns for data tables. Use when building tables, data grids, sorting, filtering, or pagination.
---

# TanStack Table Patterns

## Basic Table Setup

```tsx
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Song = {
  id: number;
  title: string;
  artist: string;
  createdAt: Date;
};

const columnHelper = createColumnHelper<Song>();

const columns = [
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("artist", {
    header: "Artist",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => info.getValue().toLocaleDateString(),
  }),
];

function SongsTable({ data }: { data: Song[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Type-Safe Columns with RouterOutputs

Derive column types from tRPC router outputs:

```tsx
import type { RouterOutputs } from "@/lib/trpc";

type SongFromApi = RouterOutputs["songs"]["list"][number];

const columnHelper = createColumnHelper<SongFromApi>();
```

## Link Cells with Row Actions

```tsx
import { Link, useNavigate } from "@tanstack/react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

columnHelper.display({
  id: "actions",
  cell: ({ row }) => {
    const song = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/songs/$songId" params={{ songId: song.id }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(song.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}),
```

## Clickable Row Navigation

```tsx
<TableRow
  key={row.id}
  className="cursor-pointer"
  onClick={() => navigate({ to: "/songs/$songId", params: { songId: row.original.id } })}
>
```

## Global Filter with Search Params

Sync table filter with URL search params:

```tsx
import { useSearch, useNavigate } from "@tanstack/react-router";
import { fuzzyFilter } from "@/lib/table-filters";

function SongsTable() {
  const search = useSearch({ from: "/(authed)/songs" });
  const navigate = useNavigate();
  const globalFilter = search.search || "";

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: (value) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, search: value || undefined }),
      });
    },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
}
```

## Keep Previous Data During Loading

Use `keepPreviousData` to prevent table flickering:

```tsx
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const { data = [] } = useQuery({
  ...trpc.songs.list.queryOptions({}),
  placeholderData: keepPreviousData,
});
```

## Selection with Checkbox Column

```tsx
import { Checkbox } from "@/components/ui/checkbox";

columnHelper.display({
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
}),
```

## Empty State

```tsx
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

{table.getRowModel().rows.length === 0 ? (
  <TableRow>
    <TableCell colSpan={columns.length} className="h-48">
      <Empty>
        <EmptyMedia>
          <IconMusic className="h-12 w-12" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No songs found</EmptyTitle>
          <EmptyDescription>
            Create your first song to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </TableCell>
  </TableRow>
) : (
  table.getRowModel().rows.map((row) => /* render rows */)
)}
```

## Common Mistakes to Avoid

1. **Derive types from API** - Use `RouterOutputs` instead of manual types
2. **Use shadcn Table components** - For consistent styling
3. **Sync filters with URL** - Use search params for shareable filtered views
4. **Use `keepPreviousData`** - Prevents flickering during refetches
5. **Add empty states** - Always handle zero results gracefully
