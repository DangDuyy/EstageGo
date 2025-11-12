import React, { useState } from "react"
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreVertical,
    Columns3,
    Eye,
    Pencil,
    Trash2,
    ImageOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

export default function PropertyTable({ data, onPageChange, onPageSizeChange }) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState({})
    const navigate = useNavigate()

    const formatPrice = (value, currency) => {
        if (!value) return "N/A"
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency || 'VND',
            maximumFractionDigits: 0
        }).format(value)
    }

    const columns = [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 50,
        },
        {
            accessorKey: "media",
            header: "Image",
            cell: ({ row }) => {
                const media = row.original.media || []
                const imageMedia = media.find(m => m.type === 'image')

                return (
                    <div className="w-30 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {imageMedia ? (
                            <img
                                src={imageMedia.url}
                                alt={row.original.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    const icon = document.createElement('div')
                                    icon.className = 'text-muted-foreground'
                                    icon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
                                    e.target.parentElement.appendChild(icon)
                                }}
                            />
                        ) : (
                            <ImageOff className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                )
            },
            size: 100,
        },
        {
            accessorKey: "title",
            header: "Property",
            cell: ({ row }) => (
                <div className="min-w-[250px] max-w-[300px]">
                    <div className="font-medium truncate">{row.original.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {row.original.description}
                    </div>
                    <div className="font-medium text-sm text-primary">
                        {formatPrice(row.original.price.value, row.original.price.currency)}/{row.original.price?.period}
                    </div>
                </div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize whitespace-nowrap">
                    {row.original.type}
                </Badge>
            ),
            size: 100,
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
            cell: ({ row }) => (
                <Badge
                    variant={row.original.purpose === 'sale' ? 'default' : 'secondary'}
                    className="capitalize whitespace-nowrap"
                >
                    {row.original.purpose}
                </Badge>
            ),
            size: 100,
        },
        {
            accessorKey: "area",
            header: "Area",
            cell: ({ row }) => (
                <div className="text-sm whitespace-nowrap">
                    {row.original.area} m²
                </div>
            ),
            size: 100,
        },
        {
            accessorKey: "rooms",
            header: "Rooms",
            cell: ({ row }) => {
                const rooms = row.original.rooms
                return (
                    <div className="text-xs space-y-0.5 whitespace-nowrap">
                        <div>🛏️ {rooms.bedrooms || 0} Beds</div>
                        <div>🚿 {rooms.bathrooms || 0} Baths</div>
                    </div>
                )
            },
            size: 120,
        },
        // {
        //     accessorKey: "price",
        //     header: "Price",
        //     cell: ({ row }) => (
        //         <div className="min-w-[120px]">
        //             <div className="font-medium text-sm">
        //                 {formatPrice(row.original.price.value, row.original.price.currency)}
        //             </div>
        //             {row.original.price.period !== 'other' && (
        //                 <div className="text-xs text-muted-foreground">
        //                     /{row.original.price.period}
        //                 </div>
        //             )}
        //         </div>
        //     ),
        // },
        {
            accessorKey: "address",
            header: "Location",
            cell: ({ row }) => (
                <div className="text-xs min-w-[200px] max-w-[250px] truncate">
                    {row.original.address.fullAddress}
                </div>
            ),
        },
        {
            accessorKey: "ownerInfo",
            header: "Owner",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 min-w-[180px]">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={row.original.ownerInfo.avatar} />
                        <AvatarFallback>
                            {row.original.ownerInfo.fullName?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-xs overflow-hidden">
                        <div className="font-medium truncate">
                            {row.original.ownerInfo.fullName}
                        </div>
                        <div className="text-muted-foreground truncate">
                            @{row.original.ownerInfo.userName}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                const variant = status === 'active' ? 'default' :
                    status === 'pending' ? 'secondary' : 'destructive'
                return (
                    <Badge variant={variant} className="capitalize whitespace-nowrap">
                        {status}
                    </Badge>
                )
            },
            size: 100,
        },
        {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ row }) => (
                <div className="text-xs whitespace-nowrap">
                    {new Date(row.original.createdAt).toLocaleDateString('vi-VN')}
                </div>
            ),
            size: 100,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { navigate(`/properties/${row.id}`) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            size: 70,
        },
    ]

    const table = useReactTable({
        data: data?.properties || [],
        columns,
        state: {
            rowSelection,
            columnVisibility,
        },
        manualPagination: true,
        pageCount: Math.ceil((data?.totalProperties || 0) / (data?.itemsPerPage || 10)),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row._id,
    })

    const currentPage = data?.page || 1
    const pageSize = data?.itemsPerPage || 10
    const totalPages = Math.ceil((data?.totalProperties || 0) / pageSize)

    const handlePageSizeChange = (newSize) => {
        if (onPageSizeChange) {
            onPageSizeChange(Number(newSize))
        }
    }

    const handlePageChange = (newPage) => {
        if (onPageChange) {
            onPageChange(newPage)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Properties Management</CardTitle>
                        <CardDescription className="mt-1">
                            Total: {data?.totalProperties || 0} properties
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Columns3 className="mr-2 h-4 w-4" />
                                Columns
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table.getAllColumns().filter(col => col.getCanHide()).map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Scrollable Table Container */}
                    <div className="rounded-md border overflow-auto max-w-full">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className="bg-muted/50"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className={'py-4'}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No properties found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            {Object.keys(rowSelection).length} of {data?.properties?.length || 0} row(s) selected
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Rows per page</span>
                                <Select
                                    value={`${pageSize}`}
                                    onValueChange={handlePageSizeChange}
                                >
                                    <SelectTrigger className="w-[70px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 20, 30, 40, 50].map((size) => (
                                            <SelectItem key={size} value={`${size}`}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="text-sm font-medium">
                                Page {currentPage} of {totalPages || 1}
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="h-8 w-8"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage >= totalPages}
                                    className="h-8 w-8"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}