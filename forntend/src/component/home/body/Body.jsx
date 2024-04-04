import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import instance from '../../../config/axiosConfig';
import { Link } from 'react-router-dom';

const columns = [
  { id: 'invoice_no', label: 'Invoice Number', minWidth: 170 },
  { id: 'createdDate', label: 'Date', minWidth: 100 },
  {
    id: 'location',
    label: 'Location',
    minWidth: 170,
    align: 'right',
   
  },
  {
    id: 'totalAmount',
    label: 'Total Amount',
    minWidth: 170,
    align: 'right',
   
  },
  {
    id: 'invoiceStatus',
    label: 'Status',
    minWidth: 170,
    align: 'right',
  },
  {
    id: 'quantity',
    label: 'Quantity',
    minWidth: 170,
    align: 'right',
  }
];



export default function StickyHeadTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const[invoice ,setInvoice] = React.useState([]);
  React.useEffect(()=>{
    async function fetchData(){
      const location_key = localStorage.getItem("jwt")
      const res = await instance.get('/getAllInvoice/'+location_key)
        
      setInvoice(res.data?.data)
    }
    
    fetchData()
  } , [])

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
   <>
   {invoice.length>0 && 
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                let url  = "/invoiceDetail/"+row['invoice_no']
                row['invoice_no'] = <Link to={url}  className=' text-blue-600 underline cursor-pointer'>{row['invoice_no']}</Link>
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={invoice.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
}
    </>
    
  );
}