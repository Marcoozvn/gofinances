import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

import { Button } from '../../components/Forms/Button';
import { CategorySelectButton } from '../../components/Forms/CategorySelectButton';
import { TransactionTypeButton } from '../../components/Forms/TransactionTypeButton';
import { CategorySelect } from '../CategorySelect';
import { InputForm } from '../../components/Forms/InputForm';

import { 
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransactionTypes 
} from './styles';

interface FormData {
  name: string;
  amount: string;
}

const schema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  amount: Yup
    .number()
    .typeError('Informe um valor numérico')
    .positive('O valor não pode ser negativo')
    .required('O valor é obrigatório.')
});

export function Register() {
  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpened, setCategoryModalOpened] = useState(false);
  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria'
  });

  const navigation = useNavigation();
  const { control, reset, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  function handleCloseSelectCategoryModal() {
    setCategoryModalOpened(false);
  }

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpened(true);
  }

  async function handleRegister(form: FormData) {
    if (!transactionType) {
      return Alert.alert('Selecione o tipo da transação.');
    }

    if (category.key === 'category') {
      return Alert.alert('Selecione a categoria.');
    }

    const data = {
      id: uuid.v4(),
      ...form,
      type: transactionType,
      category: category.key,
      date: new Date()
    }

    try {
      const dataKey = '@gofinances:transactions';
      
      const storage = await AsyncStorage.getItem(dataKey);
      const currentData = storage ? JSON.parse(storage) : [];
      
      await AsyncStorage.setItem(dataKey, JSON.stringify([...currentData, data]));

      resetForm();


      navigation.navigate('Listagem');

    } catch (error) {
      console.log(error);
      Alert.alert('Não foi possível salvar');
    }
  }

  function resetForm() {
    setTransactionType('');
    setCategory({
      key: 'category',
      name: 'Categoria'
    });
    reset();
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm 
              name='name' 
              placeholder='Nome' 
              control={control}
              autoCapitalize='sentences'
              autoCorrect={false}
              error={errors.name && errors.name.message} />

            <InputForm 
              name='amount' 
              placeholder='Preço' 
              control={control}
              keyboardType='numeric'
              error={errors.amount && errors.amount.message} />

            <TransactionTypes>
              <TransactionTypeButton 
                type='up' 
                title='Income' 
                onPress={() => setTransactionType('positive')} 
                isActive={transactionType === 'positive'}
                />

              <TransactionTypeButton 
                type='down' 
                title='Outcome' 
                onPress={() => setTransactionType('negative')} 
                isActive={transactionType === 'negative'}
                />
            </TransactionTypes>

            <CategorySelectButton title={category.name} onPress={handleOpenSelectCategoryModal} />

          </Fields>

          <Button title='Enviar' onPress={handleSubmit(handleRegister)} />
        </Form>

        <Modal visible={categoryModalOpened}>
          <CategorySelect  
            category={category} 
            setCategory={setCategory} 
            closeSelectCategory={handleCloseSelectCategoryModal}/>
        </Modal>

      </Container>
    </TouchableWithoutFeedback>
  )
}