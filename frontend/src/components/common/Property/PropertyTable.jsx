import { boostPropertyAPI, deletePropertyAPI, getMembershipInfoAPI } from "@/apis"
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
import { selectCurrentUser, updateUser } from "@/redux/user/userSlice"
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
import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export default function PropertyTable({ data, onPageChange, onPageSizeChange }) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState({})
    const [boostDialogOpen, setBoostDialogOpen] = useState(false)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [selectedDuration, setSelectedDuration] = useState(24)
    const [boosting, setBoosting] = useState(false)
    const [deletedIds, setDeletedIds] = useState(new Set())
    const [membershipType, setMembershipType] = useState('basic')
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const currentUser = useSelector(selectCurrentUser)

    // Fetch membership from UserMembership model
    useEffect(() => {
        const fetchMembership = async () => {
            try {
                const result = await getMembershipInfoAPI()
                if (result?.data?.membershipType) {
                    setMembershipType(result.data.membershipType)
                }
            } catch (error) {
                console.error('Failed to fetch membership:', error)
                setMembershipType('basic')
            }
        }
        if (currentUser) {
            fetchMembership()
        }
    }, [currentUser])

    const formatPrice = (value, currency) => {
        if (!value) return "N/A"
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency || 'VND',
            maximumFractionDigits: 0
        }).format(value)
    }

    const getBoostCreditsNeeded = (durationHours = 24) => {
        // 1 credit = 24h, so 24h=1, 48h=2, 72h=3
        return Math.ceil(durationHours / 24)
    }

    const getBoostPrice = (durationHours = 24) => {
        let basePrice = 100000 // basic
        if (membershipType === 'advanced') basePrice = 50000
        else if (membershipType === 'boosted') basePrice = 75000
        
        // Pricing based on duration
        if (durationHours === 24) return basePrice
        if (durationHours === 48) return Math.floor(basePrice * 1.8) // 80% more
        if (durationHours === 72) return Math.floor(basePrice * 2.5) // 150% more
        return basePrice
    }

    const handleBoostClick = (property) => {
        setSelectedProperty(property)
        setSelectedDuration(24) // Reset to 24h default
        setBoostDialogOpen(true)
    }

    const handleConfirmBoost = async () => {
        if (!selectedProperty) return

        try {
            setBoosting(true)
            const creditsNeeded = getBoostCreditsNeeded(selectedDuration)
            const useCredits = (currentUser?.boostCredits || 0) >= creditsNeeded
            await boostPropertyAPI(selectedProperty._id, useCredits, selectedDuration)
            
            // Deduct credits from user if they were used
            if (useCredits) {
                const updatedCredits = (currentUser?.boostCredits || 0) - creditsNeeded
                dispatch(updateUser({ boostCredits: updatedCredits }))
            }
            
            setBoostDialogOpen(false)
            setSelectedProperty(null)
            toast.success(`Property boosted for ${selectedDuration} hours successfully! ${useCredits ? `(${creditsNeeded} credit${creditsNeeded > 1 ? 's' : ''} used)` : ''}`)

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

    const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null
        const now = new Date()
        const end = new Date(expiresAt)
        const diffMs = end - now
        if (diffMs <= 0) return null
        const totalMinutes = Math.floor(diffMs / (1000 * 60))
        const days = Math.floor(totalMinutes / (60 * 24))
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
        const minutes = totalMinutes % 60
        if (days > 0) return `${days}d ${hours}h ${minutes}m`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    const isBoostActive = (property) => {
        if (!property?.boostExpiresAt) return false
        return new Date(property.boostExpiresAt) > new Date()
    }

    // Dashboard (non-admin area): always show only current user's posts
    // This logic seems fine for a user's dashboard view.
    const allProperties = data?.properties || []
    const filteredProperties = allProperties.filter((p) => (
        p?.owner === currentUser?._id || p?.owner?._id === currentUser?._id
    ))
    const displayProperties = filteredProperties.filter((p) => !deletedIds.has(p?._id))
    const totalFromApi = data?.totalProperties ?? data?.pagination?.total ?? displayProperties.length
    const effectiveTotal = Math.max(0, totalFromApi - deletedIds.size)

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
                <div className="min-w-[100px] max-w-[150px]">
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
            cell: ({ row }) => {
                const address = row.original.address || {}
                const parts = [
                    address.street,
                    address.ward,
                    address.district,
                    address.province,
                    address.country
                ].filter(Boolean) // Loại bỏ các giá trị null/undefined/empty
                
                const fullAddress = parts.join(', ')
                
                return (
                    <div className="text-xs min-w-[100px] max-w-[150px] truncate" title={fullAddress}>
                        {fullAddress || 'N/A'}
                    </div>
                )
            },
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
                        {isOwner && row.original.status === 'active' && (() => {
                            const hasBeenBoosted = row.original.bumpedAt
                            
                            return (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBoostClick(row.original)}
                                    className={`gap-1 whitespace-nowrap ${
                                        hasBeenBoosted
                                            ? 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                                            : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200'
                                    }`}
                                >
                                    <Zap className="h-3 w-3" />
                                    <span className="flex items-center gap-1">
                                        {hasBeenBoosted ? 'Extra boost' : 'Boost new'}
                                    </span>
                                </Button>
                            )
                        })()}
                        
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
                                    View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { navigate(`/properties/${row.original._id}`) }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View public
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { navigate(`/dashboard/posts/edit/${row.original._id}`) }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteProps(row.original._id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 150,
        },
    ]

    const pageSize = Math.max(1, Number(data?.itemsPerPage ?? data?.pagination?.limit ?? 10))
    const currentPage = Number(data?.page ?? data?.pagination?.page ?? 1)
    const totalPages = Math.max(1, Math.ceil((effectiveTotal || 0) / pageSize))

    const table = useReactTable({
        data: displayProperties,
        columns,
        state: {
            rowSelection,
            columnVisibility,
        },
        manualPagination: true,
        pageCount: totalPages,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row._id,
    })

    const handlePageSizeChange = (newSize) => {
        const sizeNumber = Number(newSize)
        if (onPageSizeChange && !Number.isNaN(sizeNumber)) {
            onPageSizeChange(sizeNumber)
        }
    }

    const handlePageChange = (newPage) => {
        if (onPageChange) {
            const targetPage = Math.max(1, Math.min(newPage, totalPages || 1))
            onPageChange(targetPage)
        }
    }
    const handleDeleteProps = async (propertyId) => {
        if (!propertyId) {
            toast.error("Invalid property id")
            return
        }
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return

        try {
            await deletePropertyAPI(propertyId)
            // Optimistically hide the deleted row
            setDeletedIds((prev) => {
                const next = new Set(prev)
                next.add(propertyId)
                return next
            })
            // Ask parent to refresh current page if provided
            if (typeof onPageChange === 'function') {
                onPageChange(data?.page || 1)
            }
            toast.success("Property deleted successfully")
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to delete property"
            toast.error(msg)
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
                            {Object.keys(rowSelection).length} of {displayProperties.length || 0} row(s) selected
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

                                <div className="space-y-3 text-sm">
                                    <p className="text-foreground">
                                        {isBoostActive(selectedProperty) 
                                            ? 'This listing is currently boosted. Select duration to extend:'
                                            : 'Are you sure you want to boost this listing to the top?'}
                                    </p>
                                    
                                    {selectedProperty.bumpedAt && (
                                        <div className="flex items-center justify-between text-xs bg-blue-50 p-2 rounded">
                                            <span className="text-muted-foreground">Last Boost:</span>
                                            <span className="font-medium text-foreground">
                                                {getTimeSinceBoost(selectedProperty.bumpedAt)}
                                            </span>
                                        </div>
                                    )}

                                    {isBoostActive(selectedProperty) && (
                                        <div className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
                                            <span className="text-muted-foreground">Remaining Time:</span>
                                            <span className="font-semibold text-green-600">
                                                {getTimeRemaining(selectedProperty.boostExpiresAt)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Duration Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Select {isBoostActive(selectedProperty) ? 'extension' : 'boost'} duration:</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[24, 48, 72].map((hours) => {
                                                const creditsNeeded = getBoostCreditsNeeded(hours)
                                                return (
                                                    <button
                                                        key={hours}
                                                        type="button"
                                                        onClick={() => setSelectedDuration(hours)}
                                                        className={`p-3 rounded-lg border-2 transition-all ${
                                                            selectedDuration === hours
                                                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                                : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="font-bold text-foreground">{hours}h</div>
                                                        <div className={`text-xs mt-1 ${
                                                            (currentUser?.boostCredits || 0) >= creditsNeeded
                                                                ? 'text-purple-600 font-medium'
                                                                : 'text-muted-foreground'
                                                        }`}>
                                                            {(currentUser?.boostCredits || 0) >= creditsNeeded
                                                                ? `${creditsNeeded} credit${creditsNeeded > 1 ? 's' : ''}`
                                                                : formatPrice(getBoostPrice(hours), 'VND')
                                                            }
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t space-y-2">
                                        {(currentUser?.boostCredits || 0) >= getBoostCreditsNeeded(selectedDuration) ? (
                                            <div className="space-y-1 bg-purple-50 p-3 rounded-lg">
                                                <div className="flex justify-between text-foreground">
                                                    <span className="font-medium">Using:</span>
                                                    <span className="font-semibold text-purple-600">{getBoostCreditsNeeded(selectedDuration)} Boost Credit{getBoostCreditsNeeded(selectedDuration) > 1 ? 's' : ''}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span>Credits remaining:</span>
                                                    <span className="font-medium">{(currentUser?.boostCredits || 0) - getBoostCreditsNeeded(selectedDuration)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-foreground bg-orange-50 p-3 rounded-lg">
                                                <div>
                                                    <div className="font-medium">Boost Fee ({selectedDuration}h):</div>
                                                    {selectedDuration > 24 && (
                                                        <div className="text-xs text-green-600 mt-1">
                                                            Save {Math.round(((getBoostPrice(24) * (selectedDuration/24)) - getBoostPrice(selectedDuration)) / 1000)}k!
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-lg">
                                                    {formatPrice(getBoostPrice(selectedDuration), 'VND')}
                                                </span>
                                            </div>
                                        )}
                                        {isBoostActive(selectedProperty) && (
                                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                ℹ️ Duration will be extended by {selectedDuration}h
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
                                {isBoostActive(selectedProperty) ? `Add ${selectedDuration}h` : `Confirm ${selectedDuration}h Boost`}
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}