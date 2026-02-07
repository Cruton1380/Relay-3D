export default function TestPage() {
  console.log('🧪 [TestPage] RENDERING');
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'red', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '48px',
      color: 'white',
      fontWeight: 'bold'
    }}>
      TEST ROUTE WORKS
    </div>
  );
}
