import React from 'react'

const Footer = () => {
    return (
        <footer className="footer">
            <p className="fs-11 text-muted fw-medium text-uppercase mb-0 copyright">
                <span>Copyright ©Ocevia Lab </span>
                {new Date().getFullYear()}
            </p>
          
        </footer>
    )
}

export default Footer