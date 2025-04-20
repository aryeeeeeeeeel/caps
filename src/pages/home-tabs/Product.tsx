import { 
  IonButtons,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonIcon,
  IonAlert,
  IonToast,
  IonLoading
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Product {
  id?: number;
  name: string;
  description: string;
  current_stock: number;
  arrived_stock: number;
  batch_date: string;
  expiration_date: string;
  is_out_of_stock: boolean;
  created_at?: string;
}

const Products: React.FC = () => {
  const history = useHistory();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Fetch only available products (not out of stock) from Supabase
  const fetchAvailableProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_out_of_stock', false)  // Only fetch products that are not out of stock
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

  // Handle edit redirect
  const handleEdit = (productId: number) => {
    history.push(`/TRA-Manolo-Fortich/app/home/inventory/${productId}`);
  };

  // Delete product confirmation
  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setAlertMessage('Are you sure you want to delete this product?');
    setShowAlert(true);
  };

  // Delete product
  const handleDelete = async () => {
    if (!productToDelete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);

      if (error) throw error;
      setSuccess('Product deleted successfully');
      fetchAvailableProducts(); // Refresh the available products list
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error deleting product:', err);
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

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
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Arrived Stock</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Batch Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Expiration</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{product.name}</td>
                      <td style={{ padding: '10px' }}>{product.description}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{product.current_stock}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{product.arrived_stock}</td>
                      <td style={{ padding: '10px' }}>{new Date(product.batch_date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px' }}>{new Date(product.expiration_date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ 
                          color: 'green',
                          fontWeight: 'bold'
                        }}>
                          In Stock
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleEdit(product.id!)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#3880ff', 
                            cursor: 'pointer',
                            marginRight: '10px'
                          }}
                        >
                          <FaEdit size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(product.id!)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#eb445a', 
                            cursor: 'pointer' 
                          }}
                        >
                          <FaTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alert for delete confirmation */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Confirm'}
          message={alertMessage}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'OK',
              handler: () => {
                if (productToDelete) handleDelete();
              }
            }
          ]}
        />

        {/* Success Toast */}
        <IonToast
          isOpen={!!success}
          onDidDismiss={() => setSuccess('')}
          message={success}
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default Products;