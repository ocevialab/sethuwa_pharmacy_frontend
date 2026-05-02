import React from 'react'
import { Link } from 'react-router-dom'

const SupplierCreateHeader = () => {
    return (
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link to="/supplier/list" className="btn btn-light-brand">
                <span>Back to List</span>
            </Link>
        </div>
    )
}

export default SupplierCreateHeader;

