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
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonAlert,
  IonToast,
  IonLoading
} from '@ionic/react';
import { add, create, trash } from 'ionicons/icons';
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

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    name: '',
    description: '',
    current_stock: 0,
    arrived_stock: 0,
    batch_date: new Date().toISOString(),
    expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    is_out_of_stock: false
  });

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof Product, value: any) => {
    setCurrentProduct(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-update out_of_stock status
    if (field === 'current_stock') {
      setCurrentProduct(prev => ({
        ...prev,
        is_out_of_stock: value <= 0
      }));
    }
  };

  // Submit form (create or update)
  const handleSubmit = async () => {
    if (!currentProduct.name) {
      setAlertMessage('Product name is required');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      if (isEditing && currentProduct.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(currentProduct)
          .eq('id', currentProduct.id);

        if (error) throw error;
        setSuccess('Product updated successfully');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([currentProduct]);

        if (error) throw error;
        setSuccess('Product added successfully');
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      setError('Failed to save product');
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
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
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error deleting product:', err);
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentProduct({
      name: '',
      description: '',
      current_stock: 0,
      arrived_stock: 0,
      batch_date: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_out_of_stock: false
    });
    setIsEditing(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Products Management</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="ion-padding">
          {/* Product Form */}
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            
            <IonItem>
              <IonLabel position="stacked">Product Name*</IonLabel>
              <IonInput
                value={currentProduct.name}
                onIonChange={e => handleInputChange('name', e.detail.value!)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonInput
                value={currentProduct.description}
                onIonChange={e => handleInputChange('description', e.detail.value!)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Current Stock</IonLabel>
              <IonInput
                type="number"
                value={currentProduct.current_stock}
                onIonChange={e => handleInputChange('current_stock', Number(e.detail.value!))}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Arrived Stock</IonLabel>
              <IonInput
                type="number"
                value={currentProduct.arrived_stock}
                onIonChange={e => handleInputChange('arrived_stock', Number(e.detail.value!))}
              />
            </IonItem>

            <IonItem>
  <IonLabel position="stacked">Batch Date</IonLabel>
  <IonDatetime
    presentation="date"
    locale="en-US"
    value={currentProduct.batch_date}
    onIonChange={e => handleInputChange('batch_date', e.detail.value!)}
  />
</IonItem>

<IonItem>
  <IonLabel position="stacked">Expiration Date</IonLabel>
  <IonDatetime
    presentation="date"
    locale="en-US"
    value={currentProduct.expiration_date}
    onIonChange={e => handleInputChange('expiration_date', e.detail.value!)}
  />
</IonItem>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <IonButton onClick={handleSubmit}>
                <IonIcon slot="start" icon={isEditing ? create : add} />
                {isEditing ? 'Update' : 'Add'} Product
              </IonButton>
              
              {isEditing && (
                <IonButton color="medium" onClick={resetForm}>
                  Cancel
                </IonButton>
              )}
            </div>
          </div>

          {/* Products Table */}
          <h2>Product Inventory</h2>
          {loading && products.length === 0 ? (
            <IonLoading isOpen={true} message="Loading products..." />
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : products.length === 0 ? (
            <div>No products found</div>
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
                          color: product.is_out_of_stock ? 'red' : 'green',
                          fontWeight: 'bold'
                        }}>
                          {product.is_out_of_stock ? 'Out of Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleEdit(product)}
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

export default Inventory;