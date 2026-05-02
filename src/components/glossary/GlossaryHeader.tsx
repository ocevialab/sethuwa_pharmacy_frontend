import React from "react";
import { FiBarChart, FiFilter, FiPaperclip, FiPlus } from "react-icons/fi";
import {
  BsFiletypeCsv,
  BsFiletypeExe,
  BsFiletypePdf,
  BsFiletypeTsx,
  BsFiletypeXml,
  BsPrinter,
} from "react-icons/bs";
import Dropdown from "@/components/shared/Dropdown";
import { Link } from "react-router-dom";

const filterAction = [
  { label: "All", icon: <FiBarChart /> },
  { label: "Active", icon: <FiBarChart /> },
  { label: "Deleted", icon: <FiBarChart /> },
];
const fileType = [
  { label: "PDF", icon: <BsFiletypePdf /> },
  { label: "CSV", icon: <BsFiletypeCsv /> },
  { label: "XML", icon: <BsFiletypeXml /> },
  { label: "Text", icon: <BsFiletypeTsx /> },
  { label: "Excel", icon: <BsFiletypeExe /> },
  { label: "Print", icon: <BsPrinter /> },
];

const GlossaryHeader = () => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
        <a
          href="#"
          className="btn btn-icon btn-light-brand"
          data-bs-toggle="collapse"
          data-bs-target="#collapseOne"
        >
          <FiBarChart size={16} strokeWidth={1.6} />
        </a>
        <Dropdown
          dropdownItems={filterAction}
          triggerPosition={"0, 12"}
          triggerIcon={<FiFilter size={16} strokeWidth={1.6} />}
          triggerClass="btn btn-icon btn-light-brand"
          isAvatar={false}
        />
        <Dropdown
          dropdownItems={fileType}
          triggerPosition={"0, 12"}
          triggerIcon={<FiPaperclip size={16} strokeWidth={1.6} />}
          triggerClass="btn btn-icon btn-light-brand"
          iconStrokeWidth={0}
          isAvatar={false}
        />
        <Link to="/glossary/create" className="btn btn-primary">
          <FiPlus size={16} className="me-2" />
          <span>Create Groceries</span>
        </Link>
      </div>

      <div
        id="collapseOne"
        className="accordion-collapse collapse page-header-collapse"
      >
        <div className="accordion-body pb-2">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <h5 className="card-title">Groceries Statistics</h5>
                  <p className="card-text">Statistics will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlossaryHeader;
