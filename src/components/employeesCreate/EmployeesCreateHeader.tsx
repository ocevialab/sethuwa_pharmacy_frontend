import React from 'react'
import { Link } from 'react-router-dom'

const EmployeesCreateHeader = () => {
    return (
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link to="/employees/list" className="btn btn-light-brand">
                <span>Back to List</span>
            </Link>
        </div>
    )
}

export default EmployeesCreateHeader

