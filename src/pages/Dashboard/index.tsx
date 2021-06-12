import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';

import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard } from '../../components/TransactionCard';

import { 
  Container, 
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer
} from './styles';
import { useAuth } from '../../hooks/auth';

export interface TransactionProps {
  id: string;
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface HighlightProps {
  amount: string;
  lastTransaction?: string;
}

interface HighlightData {
  entries: HighlightProps,
  expenses: HighlightProps,
  total: HighlightProps
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);

  const theme = useTheme();
  const { user, signOut } = useAuth();

  function getLastTransactionDate(
    collection: TransactionProps[],
    type: 'positive' | 'negative'
  ) {
    const lastTransaction = new Date(
      Math.max.apply(Math, collection
        .filter(item => item.type === type)
        .map(item => new Date(item.date).getTime())
      )
    );

    return Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long'
    }).format(lastTransaction);
  }

  async function loadData() {
    const dataKey = '@gofinances:transactions';
    const data = await AsyncStorage.getItem(dataKey);

    const transactions: TransactionProps[] = data ? JSON.parse(data!) : [];

    let entriesSum = 0;
    let expensesSum = 0;

    const transactionsFormatted: TransactionProps[] = transactions.map(
      (item: TransactionProps) => {

        if (item.type === 'positive') {
          entriesSum += Number(item.amount);
        } else {
          expensesSum += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }).format(new Date(item.date));
        
        return {
          ...item,
          amount,
          date
        }
      }
    );

    const lastEntry = getLastTransactionDate(transactions, 'positive');
    const lastExpense = getLastTransactionDate(transactions, 'negative');

    setHighlightData({
      expenses: {
        amount: expensesSum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastExpense
      },
      entries: {
        amount: entriesSum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastEntry
      },
      total: {
        amount: (entriesSum-expensesSum).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      }
    });

    setIsLoading(false);
    setTransactions(transactionsFormatted);
  }

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(useCallback(() => {
    loadData()
  }, []));

  return (
    <Container>
      
      { isLoading ?  
        <LoadContainer>
          <ActivityIndicator 
            color={theme.colors.primary}
            size='large' />
        </LoadContainer>
      :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{ uri: user.photo }}/>
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name='power' />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards >
            <HighlightCard 
              type='up'
              title='Entradas' 
              amount={highlightData.entries.amount} 
              lastTransaction={`Última entrada ${highlightData.entries.lastTransaction}`}/>
            <HighlightCard 
              type='down'
              title='Saídas' 
              amount={highlightData.expenses.amount} 
              lastTransaction={`Última saída ${highlightData.expenses.lastTransaction}`}/>
            <HighlightCard 
              type='total'
              title='Total' 
              amount={highlightData.total.amount} />
          </HighlightCards>
      
          <Transactions>
            <Title>Listagem</Title>

            <TransactionList
              keyExtractor={item => item.id}
              data={transactions}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />

          </Transactions>
        </>
      }
    </Container>
  )
}