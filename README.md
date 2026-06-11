# Gym Management — SaaS dla sieci klubów fitness

System do zarządzania wieloma siłowniami z jednego konta właściciela: klienci, karnety, recepcja (wejście/wyjście), szafki, personel z uprawnieniami, terminarz, grafik pracy, raporty i powiadomienia.

## Stack

- **Backend:** Spring Boot 4, Java 21, PostgreSQL, Flyway, JWT
- **Frontend:** React, TypeScript, Vite, Tailwind CSS

## Wymagania

- Java 21+
- Maven 3.9+
- Node.js 20+ (frontend)
- PostgreSQL 14+

## Uruchomienie

### 1. Baza danych

```sql
CREATE DATABASE gym_management;
```

### 2. Backend

```bash
# zmienne opcjonalne (domyślnie localhost/postgres)
set DB_URL=jdbc:postgresql://localhost:5432/gym_management
set DB_USERNAME=postgres
set DB_PASSWORD=root
set JWT_SECRET=twoj-bardzo-dlugi-sekret-jwt-min-32-znaki

mvn spring-boot:run
```

API: `http://localhost:8080`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Panel: `http://localhost:5173`

## Role

| Rola | Opis |
|------|------|
| **OWNER** | Właściciel sieci — wiele siłowni, raporty, historia, powiadomienia |
| **EMPLOYEE** | Recepcja — klienci, wejście/wyjście, karnety, szafki (wg uprawnień) |

Rejestracja pierwszego konta: `POST /api/auth/register` (OWNER).

## Główne funkcje

- **Check-in / check-out** — obecność na sali niezależna od szafki (wymaga aktywnego karnetu przy wejściu)
- **Edycja klienta** — telefon, notatki, dane kontaktowe
- **Karnety** — sprzedaż, przedłużenie, anulowanie; automatyczne wygasanie (cron 01:00)
- **Raport sprzedaży** — podział wg dnia i typu karnetu
- **Historia** — filtry: data, akcja, e-mail pracownika
- **Powiadomienia** — alerty o wygasających karnetach (panel + opcjonalny e-mail w logach)

## Zadania zaplanowane

```properties
app.jobs.expire-passes-cron=0 0 1 * * *
app.jobs.expiring-notifications-cron=0 0 8 * * *
app.notifications.email.enabled=false
```

## Testy

```bash
mvn test
cd frontend && npm test
```

## Struktura API (skrót)

- `/api/auth` — logowanie, rejestracja
- `/api/owner/gyms/{gymId}/...` — panel właściciela
- `/api/employee/gyms/{gymId}/...` — panel pracownika

Migracje Flyway: `src/main/resources/db/migration/`
