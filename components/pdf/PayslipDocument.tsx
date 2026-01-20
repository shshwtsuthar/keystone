import React from 'react'
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer'
import { PayslipData } from '@/types/payslip'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  section: { marginBottom: 10 },
  label: { color: '#666', marginBottom: 2 },
  value: { fontWeight: 'bold' },

  // Table Styles
  table: { width: '100%', marginTop: 20, borderTop: '1px solid #EEE' },
  row: { flexDirection: 'row', borderBottom: '1px solid #EEE', paddingVertical: 8 },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '2px solid #333',
    paddingVertical: 8,
    backgroundColor: '#F9F9F9',
  },

  // Table Columns (Flexbox)
  colDesc: { width: '40%' },
  colRate: { width: '20%', textAlign: 'right' },
  colQty: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  // Totals Section
  totalsArea: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
  totalLabel: { width: 100, textAlign: 'right', marginRight: 10, color: '#666' },
  totalValue: { width: 80, textAlign: 'right', fontWeight: 'bold' },
  netPayBox: { marginTop: 10, padding: 10, backgroundColor: '#EEE', flexDirection: 'row' },
  
  // Logo Styles
  logoContainer: { marginBottom: 15 },
  logo: { maxWidth: 150, maxHeight: 60, objectFit: 'contain' },
})

// Helper to format currency
const currency = (num: number) => `$${num.toFixed(2)}`

export const PayslipDocument = ({ data }: { data: PayslipData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* COMPANY LOGO */}
      {data.companyLogoUrl && (
        <View style={styles.logoContainer}>
          <Image src={data.companyLogoUrl} style={styles.logo} alt="Company logo" />
        </View>
      )}

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PAYSLIP</Text>
          <Text style={{ marginTop: 5 }}>{data.employerName}</Text>
          {data.employerABN && data.employerABN !== 'Not provided' ? (
            <Text>ABN: {data.employerABN}</Text>
          ) : (
            <Text style={{ color: '#999', fontSize: 8 }}>ABN: Not provided</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Pay Period</Text>
          <Text style={styles.value}>
            {data.payPeriodStart} - {data.payPeriodEnd}
          </Text>
          <Text style={[styles.label, { marginTop: 5 }]}>Payment Date</Text>
          <Text style={styles.value}>{data.paymentDate}</Text>
        </View>
      </View>

      {/* EMPLOYEE DETAILS */}
      <View style={[styles.section, { borderBottom: '1px solid #EEE', paddingBottom: 10 }]}>
        <Text style={styles.label}>Employee</Text>
        <Text style={[styles.value, { fontSize: 12 }]}>{data.employeeName}</Text>
        {data.classification && data.classification !== 'N/A' && (
          <Text style={styles.label}>{data.classification}</Text>
        )}
      </View>

      {/* EARNINGS TABLE */}
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colRate}>Rate</Text>
          <Text style={styles.colQty}>Hours</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {data.earnings.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colRate}>{currency(item.rate)}</Text>
            <Text style={styles.colQty}>{item.hours}</Text>
            <Text style={styles.colTotal}>{currency(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* TOTALS & TAX */}
      <View style={styles.totalsArea}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gross Pay</Text>
          <Text style={styles.totalValue}>{currency(data.grossPay)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>PAYG Tax</Text>
          <Text style={styles.totalValue}>-{currency(data.taxWithheld)}</Text>
        </View>

        <View style={styles.netPayBox}>
          <Text style={[styles.totalLabel, { color: '#000' }]}>NET PAY</Text>
          <Text style={[styles.totalValue, { fontSize: 14 }]}>{currency(data.netPay)}</Text>
        </View>
      </View>

      {/* SUPERANNUATION (Separate Section required by law) */}
      <View style={{ marginTop: 30, paddingTop: 10, borderTop: '1px dashed #CCC' }}>
        <Text style={[styles.label, { marginBottom: 5 }]}>Superannuation Contributions</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '50%' }}>
          <Text>{data.superannuation.fundName}</Text>
          <Text style={styles.value}>{currency(data.superannuation.amount)}</Text>
        </View>
        <Text style={{ fontSize: 8, color: '#999', marginTop: 5 }}>
          Note: Superannuation is paid to your fund quarterly.
        </Text>
      </View>
    </Page>
  </Document>
)

