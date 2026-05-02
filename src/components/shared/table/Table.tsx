import React, { useState, useEffect, useCallback } from 'react'
import TableSearch from './TableSearch'
import TablePagination from './TablePagination'
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa'
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import type { RowSelectionState } from '@tanstack/react-table'

type TableProps = {
    data: any[]
    columns: any[]
    /** Enable checkbox row selection (requires getRowId for stable keys) */
    enableRowSelection?: boolean
    getRowId?: (row: any) => string
    /** Called when selection changes; receives full row data objects */
    onSelectedRowsChange?: (rows: any[]) => void
    /** Increment to clear all row selections (e.g. after bulk action) */
    selectionResetKey?: number
}

const Table = ({
    data,
    columns,
    enableRowSelection = false,
    getRowId,
    onSelectedRowsChange,
    selectionResetKey = 0,
}: TableProps) => {
    const [sorting, setSorting] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const resolveRowId = useCallback(
        (row: any) => {
            if (getRowId) return getRowId(row)
            return String(row?.id ?? row?.employeeId ?? row?.customerId ?? '')
        },
        [getRowId]
    )

    useEffect(() => {
        if (enableRowSelection) {
            setRowSelection({})
        }
    }, [selectionResetKey, enableRowSelection])

    useEffect(() => {
        if (!enableRowSelection || !onSelectedRowsChange) return
        const ids = Object.keys(rowSelection).filter((id) => rowSelection[id])
        const selected = data.filter((row) => ids.includes(resolveRowId(row)))
        onSelectedRowsChange(selected)
    }, [rowSelection, data, enableRowSelection, onSelectedRowsChange, resolveRowId])

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
            pagination,
            ...(enableRowSelection ? { rowSelection } : {}),
        },
        enableRowSelection,
        onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
        getRowId: enableRowSelection ? (row) => resolveRowId(row) : undefined,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
    })


    return (
        <div className="col-lg-12">
            <div className="card stretch stretch-full function-table">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <div className='dataTables_wrapper dt-bootstrap5 no-footer'>
                            <TableSearch table={table} setGlobalFilter={setGlobalFilter} globalFilter={globalFilter}/>

                            <div className="row dt-row">
                                <div className="col-sm-12 px-0">
                                    <table className="table table-hover dataTable no-footer" id='projectList'>
                                        <thead>
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <tr key={headerGroup.id} >
                                                    {
                                                        headerGroup.headers.map((header) => {
                                                            const noSort = header.column.columnDef.meta?.noSort
                                                            return (
                                                                <th key={header.id} className={header.column.columnDef.meta?.headerClassName}>
                                                                    {noSort ? (
                                                                        flexRender(
                                                                            header.column.columnDef.header,
                                                                            header.getContext()
                                                                        )
                                                                    ) : header.id === "id" ? (
                                                                            <div className='d-flex gap-2'>
                                                                                {
                                                                                    flexRender(
                                                                                        header.column.columnDef.header,
                                                                                        header.getContext()
                                                                                    )

                                                                                }
                                                                                <ArrowToggle header={header} />
                                                                            </div>
                                                                            ) : (
                                                                            <ArrowToggle header={header}>
                                                                                {
                                                                                    flexRender(
                                                                                        header.column.columnDef.header,
                                                                                        header.getContext()
                                                                                    )
                                                                                }
                                                                            </ArrowToggle>
                                                                    )}
                                                                </th>
                                                            )
                                                        })
                                                    }
                                                </tr>
                                            ))}
                                        </thead>
                                        <tbody>
                                            {
                                                table.getRowModel().rows.map((row) => (
                                                    <tr key={row.id} className='single-item chat-single-item'>
                                                        {row.getVisibleCells().map((cell) => {
                                                            return (
                                                                <td key={cell.id} className={cell.column.columnDef.meta?.className}>
                                                                    {
                                                                        flexRender(
                                                                            cell.column.columnDef.cell,
                                                                            cell.getContext()
                                                                        )
                                                                    }
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <TablePagination table={table} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Table

const ArrowToggle = ({ header, children }) => {
    const position = header.column.getIsSorted()
    return (
        <div
            className='table-head'
            style={{
                cursor: header.column.getCanSort() ? "pointer" : "default"
            }}
            onClick={header.column.getToggleSortingHandler()}
        >

            {children}
            {
                {
                    asc: <FaSortUp size={13} opacity={position === "asc" ? 1 : .125} />,
                    desc: <FaSortDown size={13} opacity={position === "desc" ? 1 : .125} />
                }[position]
            }
            {header.column.getCanSort() && !position ? (
                <FaSort size={13} opacity={.125} />
            ) : null}
        </div>
    )
}