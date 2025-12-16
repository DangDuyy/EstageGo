import { boostPropertyAPI } from "@/apis"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { selectCurrentUser } from "@/redux/user/userSlice"
import {
    flexRender,
    getCoreRowModel,
    useReactTable
} from "@tanstack/react-table"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns3,
    Eye,
    ImageOff,
    MoreVertical,
    Pencil,
    Trash2,
    Zap
} from "lucide-react"
import { useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export default function PropertyTable({ data, onPageChange, onPageSizeChange }) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState({})
    const [boostDialogOpen, setBoostDialogOpen] = useState(false)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [boosting, setBoosting] = useState(false)
    const navigate = useNavigate()
    const currentUser = useSelector(selectCurrentUser)

    const formatPrice = (value, currency) => {
        if (!value) return "N/A"
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency || 'VND',
            maximumFractionDigits: 0
        }).format(value)
    }

    const getBoostPrice = () => {
        const membership = currentUser?.membershipLevel || 'basic'
        if (membership === 'premium') return 50000
        if (membership === 'standard') return 75000
        return 100000
    }

    const handleBoostClick = (property) => {
        setSelectedProperty(property)
        setBoostDialogOpen(true)
    }

    const handleConfirmBoost = async () => {
        if (!selectedProperty) return

        try {
            setBoosting(true)
            const useCredits = currentUser?.boostCredits > 0
            await boostPropertyAPI(selectedProperty._id, useCredits)
            
            setBoostDialogOpen(false)
            setSelectedProperty(null)
            toast.success("Property boosted successfully!")

            // Reload data after boost (A more robust solution might be to update the local state)
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        } catch (error) {
            console.error('Boost error:', error)
            const errorMessage = error.response?.data?.message || 'Failed to boost property.'
            if (error.response?.status === 402) {
                toast.error('Insufficient balance or no boost credits left. Please deposit funds or buy boost credits.')
            } else {
                toast.error(errorMessage)
            }
        } finally {
            setBoosting(false)
        }
    }

    const getTimeSinceBoost = (bumpedAt) => {
        if (!bumpedAt) return null
        const now = new Date()
        const boosted = new Date(bumpedAt)
        const diffMs = now - boosted
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)
        
        if (diffDays > 0) return `${diffDays}d ago`
        if (diffHours > 0) return `${diffHours}h ago`
        // Show minutes if less than 1 hour
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        if (diffMinutes > 0) return `${diffMinutes}m ago`
        return 'Just now'
    }

    // Dashboard (non-admin area): always show only current user's posts
    // This logic seems fine for a user's dashboard view.
    const allProperties = data?.properties || []
    const filteredProperties = allProperties.filter((p) => (
        p?.owner === currentUser?._id || p?.owner?._id === currentUser?._id
    ))

    const effectiveTotal = filteredProperties.length

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
                                    // Fallback for broken images (e.g., replace with ImageOff icon)
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    const iconDiv = document.createElement('div');
                                    iconDiv.className = 'text-muted-foreground w-6 h-6';
                                    iconDiv.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                    parent.appendChild(iconDiv);
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
            cell: ({ row }) => {
                const isOwner = row.original.owner === currentUser?._id || row.original.owner?._id === currentUser?._id;
                return (
                    <div className="flex items-center gap-2">
                        {/* Boost Button - Only for owner and active status */}
                        {isOwner && row.original.status === 'active' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBoostClick(row.original)}
                                className="gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 whitespace-nowrap"
                            >
                                <Zap className="h-3 w-3" />
                                Đẩy tin
                            </Button>
                        )}
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { navigate(`/dashboard/posts/${row.original._id}`) }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { navigate(`/properties/${row.original._id}`) }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Xem trang công khai
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { navigate(`/dashboard/posts/edit/${row.original._id}`) }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 150,
        },
    ]

    const table = useReactTable({
        data: filteredProperties,
        columns,
        state: {
            rowSelection,
            columnVisibility,
        },
        manualPagination: true,
        pageCount: Math.ceil((effectiveTotal || 0) / (data?.itemsPerPage || 10)),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row._id,
    })

    const currentPage = data?.page || 1
    const pageSize = data?.itemsPerPage || 10
    const totalPages = Math.ceil((effectiveTotal || 0) / pageSize)

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
        <>
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Properties Management</CardTitle>
                        <CardDescription className="mt-1">
                            Total: {effectiveTotal || 0} properties
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
                                                    style={{ width: header.getSize() }} // Apply size if available
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
                            {Object.keys(rowSelection).length} of {filteredProperties.length || 0} row(s) selected
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

        {/* Boost Confirmation Dialog */}
        <AlertDialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        Boost Property
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {!selectedProperty ? null : (
                            <div className="space-y-4 mt-4">
                                <div className="p-3 bg-muted rounded-lg">
                                    <div className="font-semibold text-foreground mb-2">
                                        {selectedProperty.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {selectedProperty.address?.fullAddress}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-foreground">
                                        Boosting will push this property to the top of search results for maximum visibility.
                                    </p>
                                    
                                    {selectedProperty.bumpedAt ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>Last boosted:</span>
                                            <span className="font-medium">
                                                {getTimeSinceBoost(selectedProperty.bumpedAt)}
                                            </span>
                                        </div>
                                    ) : null}

                                    <div className="pt-2 border-t space-y-1">
                                        {currentUser?.boostCredits > 0 ? (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-foreground">
                                                    <span className="font-medium">Using Boost Credit:</span>
                                                    <span className="font-semibold">1 credit</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span>Remaining credits:</span>
                                                    <span>{currentUser.boostCredits - 1}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-foreground">
                                                <span className="font-medium">Boost Fee:</span>
                                                <span className="font-semibold">
                                                    {formatPrice(getBoostPrice(), 'VND')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={boosting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmBoost}
                        disabled={boosting}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        {boosting ? (
                            <>
                                <Zap className="mr-2 h-4 w-4 animate-pulse" />
                                Boosting...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Confirm Boost
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}