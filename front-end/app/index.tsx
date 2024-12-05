import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import config from '../config';

const API_URL = `${config.API_URL}/users`;

type FormData = {
  name: string;
  birthDate: string;
  tagline: string;
  email: string;
  optionalEmail: string;
  profilePicture: string | null;
};

type User = FormData & { id: number };

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    birthDate: '',
    tagline: '',
    email: '',
    optionalEmail: '',
    profilePicture: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const response = await axios.get(API_URL);
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setFormData({ ...formData, profilePicture: result.assets[0].uri });
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      handleInputChange('birthDate', formattedDate);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.name.length > 50) {
      Alert.alert('Erro', 'O campo Nome é obrigatório e deve ter no máximo 50 caracteres.');
      return;
    }
    if (!formData.email.trim() || formData.email.length > 60 || !/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Erro', 'O campo Email é obrigatório e deve ser válido.');
      return;
    }
    if (!formData.profilePicture) {
      Alert.alert('Erro', 'A foto de perfil é obrigatória.');
      return;
    }

    try {
      if (editingUser) {
        // Atualizar usuário
        const response = await axios.put(`${API_URL}/${editingUser.id}`, formData);
        setUsers((prev) => prev.map((user) => (user.id === editingUser.id ? response.data : user)));
        setEditingUser(null);
      } else {
        // Criar usuário
        const response = await axios.post(API_URL, formData);
        setUsers((prev) => [...prev, response.data]);
      }

      setFormData({
        name: '',
        birthDate: '',
        tagline: '',
        email: '',
        optionalEmail: '',
        profilePicture: null,
      });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData(user);
  };

  const handleDelete = async (userId: number) => {
    try {
      await axios.delete(`${API_URL}/${userId}`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Cadastro de Usuários</Text>

      <View style={styles.form}>
        <Text>Nome</Text>
        <TextInput
          style={styles.input}
          maxLength={50}
          value={formData.name}
          onChangeText={(text: string) => handleInputChange('name', text)}
        />
        
        <Text>Data de Nascimento</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{formData.birthDate || 'Selecione a Data'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.birthDate ? new Date(formData.birthDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        
        <Text>Frase de Efeito</Text>
        <TextInput
          style={styles.input}
          maxLength={50}
          value={formData.tagline}
          onChangeText={(text: string) => handleInputChange('tagline', text)}
        />
        
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          maxLength={60}
          value={formData.email}
          onChangeText={(text: string) => handleInputChange('email', text)}
        />
        
        <Text>Email Opcional</Text>
        <TextInput
          style={styles.input}
          maxLength={60}
          value={formData.optionalEmail}
          onChangeText={(text: string) => handleInputChange('optionalEmail', text)}
        />
        
        <Text>Foto de Perfil</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handleImagePicker}>
          <Text>Selecionar Foto</Text>
        </TouchableOpacity>
        {formData.profilePicture && (
          <Image source={{ uri: formData.profilePicture }} style={styles.imagePreview} />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Button title={editingUser ? 'Salvar Alterações' : 'Cadastrar'} onPress={handleSave} />
          <Button
            title="Novo"
            onPress={() =>
              setFormData({
                name: '',
                birthDate: '',
                tagline: '',
                email: '',
                optionalEmail: '',
                profilePicture: null,
              })
            }
          />
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Image source={{ uri: item.profilePicture || undefined }} style={styles.imagePreviewSmall} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text>Data de Nascimento: {item.birthDate}</Text>
              <Text>Email: {item.email}</Text>
              <Text>Frase: {item.tagline}</Text>
            </View>
            <View style={styles.userActions}>
              <Button title="Editar" onPress={() => handleEdit(item)} />
              <Button title="Deletar" onPress={() => handleDelete(item.id)} color="red" />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>Nenhum usuário cadastrado</Text>}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  form: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  imagePicker: { padding: 10, backgroundColor: '#ddd', borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  imagePreview: { width: 100, height: 100, borderRadius: 5, marginBottom: 10 },
  imagePreviewSmall: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  userItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderColor: '#ddd', paddingBottom: 10 },
  userInfo: { flex: 1 },
  userActions: { flexDirection: 'row', gap: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  emptyList: { textAlign: 'center', color: '#888', marginTop: 20 },
});
