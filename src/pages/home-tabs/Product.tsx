import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonAlert,
  IonToast,
  IonLoading
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface Product {
  id?: number;
  name: string;
  description: string;
  current_stock: number;
  arrived_stock: number;
  price: number;  // Added price field
  batch_date: string;
  expiration_date: string;
  is_out_of_stock: boolean;
  created_at?: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch only available products (not out of stock) from Supabase
  const fetchAvailableProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_out_of_stock', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError('Failed to fetch available products');
      console.error('Error fetching available products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Available Products</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="ion-padding">
          {/* Products Table */}
          <h2>Available Products</h2>
          {loading && products.length === 0 ? (
            <IonLoading isOpen={true} message="Loading available products..." />
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : products.length === 0 ? (
            <div>No available products found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Current Stock</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Batch Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Expiration</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{product.name}</td>
                      <td style={{ padding: '10px' }}>{product.description}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{product.current_stock}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₱{product.price?.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '10px' }}>{new Date(product.batch_date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px' }}>{new Date(product.expiration_date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ 
                          color: product.current_stock > 0 ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {product.current_stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Products;