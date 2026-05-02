export const dashboardSalesData = [
    {
        id: 1,
        refNo: "0012",
        date: "Apr 22, 2025 12.00pm",
        customer: "Malisha Madushanka",
        medicines: [
            { name: "Paracetamol 500mg Tablets", quantity: 20 },
            { name: "Ibuprofen 200mg Caplets", quantity: 20 },
            { name: "Aspirin 100mg Tablets", quantity: 20 },
            { name: "Amoxicillin 500mg Capsules", quantity: 20 },
            { name: "Cetirizine 10mg Tablets", quantity: 20 },
            { name: "Omeprazole 20mg Capsules", quantity: 20 },
            { name: "Metformin 500mg Tablets", quantity: 20 }
        ],
        quantity: 20,
        finalPrice: "2,250.00",
        discount: "5%",
        method: "Cash",
        status: "Paid",
        issuedBy: "Premila Kumari"
    },
    {
        id: 2,
        refNo: "0011",
        date: "Apr 22, 2025 12.00pm",
        customer: "Treshi Kurera",
        medicines: [
            { name: "Paracetamol 500mg Tablets", quantity: 20 },
            { name: "Ibuprofen 200mg Caplets", quantity: 20 },
            { name: "Aspirin 100mg Tablets", quantity: 20 }
        ],
        quantity: 20,
        finalPrice: "1,250.00",
        discount: "0.1%",
        method: "Card",
        status: "Paid",
        issuedBy: "Premila Kumari"
    },
    {
        id: 3,
        refNo: "0010",
        date: "Apr 22, 2025 12.00pm",
        customer: "Unknown",
        medicines: [
            { name: "Panadol", quantity: 20 }
        ],
        quantity: 20,
        finalPrice: "50.00",
        discount: "0%",
        method: "Cash",
        status: "Paid",
        issuedBy: "Premila Kumari"
    },
    {
        id: 4,
        refNo: "0009",
        date: "Apr 22, 2025 12.00pm",
        customer: "Sandali Matheesha",
        medicines: [
            { name: "Paracetamol 500mg Tablets", quantity: 20 },
            { name: "Ibuprofen 200mg Caplets", quantity: 20 },
            { name: "Aspirin 100mg Tablets", quantity: 20 },
            { name: "Amoxicillin 500mg Capsules", quantity: 20 },
            { name: "Cetirizine 10mg Tablets", quantity: 20 },
            { name: "Omeprazole 20mg Capsules", quantity: 20 },
            { name: "Metformin 500mg Tablets", quantity: 20 }
        ],
        quantity: 20,
        finalPrice: "2,250.00",
        discount: "5%",
        method: "N/A",
        status: "Due",
        issuedBy: "Premila Kumari"
    },
    {
        id: 5,
        refNo: "0008",
        date: "Apr 22, 2025 12.00pm",
        customer: "Unknow",
        medicines: [
            { name: "Paracetamol 500mg Tablets", quantity: 20 },
            { name: "Ibuprofen 200mg Caplets", quantity: 20 },
            { name: "Aspirin 100mg Tablets", quantity: 20 },
            { name: "Amoxicillin 500mg Capsules", quantity: 20 },
            { name: "Cetirizine 10mg Tablets", quantity: 20 },
            { name: "Omeprazole 20mg Capsules", quantity: 20 },
            { name: "Metformin 500mg Tablets", quantity: 20 }
        ],
        quantity: 20,
        finalPrice: "2,250.00",
        discount: "0%",
        method: "Bank Transfer",
        status: "Due",
        issuedBy: "Premila Kumari"
    },
    {
        id: 6,
        refNo: "0007",
        date: "Apr 21, 2025 11.30am",
        customer: "John Doe",
        medicines: [
            { name: "Paracetamol 500mg Tablets", quantity: 15 },
            { name: "Ibuprofen 200mg Caplets", quantity: 15 }
        ],
        quantity: 15,
        finalPrice: "1,500.00",
        discount: "3%",
        method: "Card",
        status: "Paid",
        issuedBy: "Premila Kumari"
    },
    {
        id: 7,
        refNo: "0006",
        date: "Apr 21, 2025 10.15am",
        customer: "Jane Smith",
        medicines: [
            { name: "Aspirin 100mg Tablets", quantity: 30 },
            { name: "Amoxicillin 500mg Capsules", quantity: 30 }
        ],
        quantity: 30,
        finalPrice: "3,000.00",
        discount: "10%",
        method: "Cash",
        status: "Paid",
        issuedBy: "Premila Kumari"
    },
    {
        id: 8,
        refNo: "0005",
        date: "Apr 20, 2025 3.45pm",
        customer: "Robert Johnson",
        medicines: [
            { name: "Cetirizine 10mg Tablets", quantity: 25 },
            { name: "Omeprazole 20mg Capsules", quantity: 25 }
        ],
        quantity: 25,
        finalPrice: "2,500.00",
        discount: "0%",
        method: "Bank Transfer",
        status: "Due",
        issuedBy: "Premila Kumari"
    },
    {
        id: 9,
        refNo: "0004",
        date: "Apr 20, 2025 2.20pm",
        customer: "Sarah Williams",
        medicines: [
            { name: "Metformin 500mg Tablets", quantity: 40 }
        ],
        quantity: 40,
        finalPrice: "800.00",
        discount: "5%",
        method: "Card",
        status: "Paid",
        issuedBy: "Premila Kumari"
    },
    {
        id: 10,
        refNo: "0003",
        date: "Apr 19, 2025 4.30pm",
        customer: "Michael Brown",
        medicines: [
            { name: "Paracetamol 500mg Tablets", quantity: 50 },
            { name: "Ibuprofen 200mg Caplets", quantity: 50 },
            { name: "Aspirin 100mg Tablets", quantity: 50 }
        ],
        quantity: 50,
        finalPrice: "5,000.00",
        discount: "8%",
        method: "Cash",
        status: "Paid",
        issuedBy: "Premila Kumari"
    }
]

// Generate additional entries to reach 120 total
const generateAdditionalEntries = () => {
    const additionalEntries = [];
    const customers = ["John Doe", "Jane Smith", "Robert Johnson", "Sarah Williams", "Michael Brown", "Emily Davis", "David Wilson", "Lisa Anderson", "James Taylor", "Maria Garcia"];
    const medicines = [
        [{ name: "Paracetamol 500mg Tablets", quantity: 20 }, { name: "Ibuprofen 200mg Caplets", quantity: 20 }],
        [{ name: "Aspirin 100mg Tablets", quantity: 30 }],
        [{ name: "Amoxicillin 500mg Capsules", quantity: 25 }, { name: "Cetirizine 10mg Tablets", quantity: 25 }],
        [{ name: "Omeprazole 20mg Capsules", quantity: 15 }],
        [{ name: "Metformin 500mg Tablets", quantity: 40 }],
        [{ name: "Panadol", quantity: 20 }],
    ];
    const methods = ["Cash", "Card", "Bank Transfer", "N/A"];
    const statuses = ["Paid", "Due"];
    const discounts = ["0%", "0.1%", "3%", "5%", "8%", "10%"];

    for (let i = 11; i <= 120; i++) {
        const refNo = String(i).padStart(4, '0');
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const medicineSet = medicines[Math.floor(Math.random() * medicines.length)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const discount = discounts[Math.floor(Math.random() * discounts.length)];
        const basePrice = Math.floor(Math.random() * 5000) + 500;
        const finalPrice = (basePrice * (1 - parseFloat(discount.replace('%', '')) / 100)).toFixed(2);
        
        additionalEntries.push({
            id: i,
            refNo: refNo,
            date: `Apr ${Math.floor(Math.random() * 22) + 1}, 2025 ${Math.floor(Math.random() * 12) + 1}.${String(Math.floor(Math.random() * 60)).padStart(2, '0')}${Math.random() > 0.5 ? 'am' : 'pm'}`,
            customer: customer,
            medicines: medicineSet,
            quantity: medicineSet.reduce((sum, m) => sum + m.quantity, 0),
            finalPrice: finalPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            discount: discount,
            method: method,
            status: status,
            issuedBy: "Premila Kumari"
        });
    }
    return additionalEntries;
};

export const dashboardSalesDataFull = [...dashboardSalesData, ...generateAdditionalEntries()];

