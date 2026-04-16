import React, { useMemo, useState } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle } from 'lucide-react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { sendAdminNotificationEmails } from '../lib/adminNotifications';

const SLOT_START = 8;
const SLOT_END = 17;
const SLOT_STEP_MINUTES = 30;
const DAYS_AHEAD = 90;

function getEasterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildHolidays(year: number) {
  const easter = getEasterDate(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);
  const ascension = new Date(easter);
  ascension.setDate(ascension.getDate() + 39);
  const pentecostMonday = new Date(easter);
  pentecostMonday.setDate(pentecostMonday.getDate() + 50);

  return new Set([
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-05-08`,
    `${year}-07-14`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
    toDateKey(easterMonday),
    toDateKey(ascension),
    toDateKey(pentecostMonday)
  ]);
}

function isBusinessDay(date: Date, holidays: Set<string>) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) {
    return false;
  }

  return !holidays.has(toDateKey(date));
}

function buildAvailableDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const years = [today.getFullYear(), today.getFullYear() + 1];
  const holidays = new Set(years.flatMap((year) => Array.from(buildHolidays(year))));

  const availableDates: string[] = [];
  for (let offset = 0; offset <= DAYS_AHEAD; offset += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + offset);

    if (isBusinessDay(current, holidays)) {
      availableDates.push(toDateKey(current));
    }
  }

  return availableDates;
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let hour = SLOT_START; hour <= SLOT_END; hour += 1) {
    const maxMinutes = hour === SLOT_END ? 0 : 59;
    for (let minutes = 0; minutes <= maxMinutes; minutes += SLOT_STEP_MINUTES) {
      const formatted = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      slots.push(formatted);
    }
  }
  return slots;
}

export function Appointment() {
  const availableDates = useMemo(() => buildAvailableDates(), []);
  const availableTimeSlots = useMemo(() => buildTimeSlots(), []);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: availableDates[0] || '',
    time: availableTimeSlots[0] || '08:00',
    reason: 'examen',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!availableDates.includes(formData.date)) {
      alert('Cette date n\'est pas disponible. Merci de choisir un autre jour.');
      return;
    }

    if (!availableTimeSlots.includes(formData.time)) {
      alert('Cet horaire n\'est pas disponible. Merci de choisir un créneau valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...formData,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      try {
        const notificationText = `📅 Nouveau rendez-vous pour ${formData.name}\n\n` +
          `👤 Nom : ${formData.name}\n` +
          `📞 Téléphone : ${formData.phone}\n` +
          `📅 Date : ${formData.date}\n` +
          `🕒 Heure : ${formData.time}\n` +
          `📝 Motif : ${formData.reason}`;

        await sendAdminNotificationEmails({
          subject: 'Nouveau rendez-vous SK OPTIC',
          text: notificationText,
          html: '',
        });
      } catch (notificationError) {
        console.warn('Notification admin non envoyée:', notificationError);
      }

      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Rendez-vous Confirmé</h2>
          <p className="text-lg text-gray-600 mb-8">
            Merci {formData.name}. Votre rendez-vous est prévu le {formData.date} à {formData.time}.
          </p>
          <button
            onClick={() => {
              setFormData({
                name: '',
                            phone: '',
                date: availableDates[0] || '',
                time: availableTimeSlots[0] || '08:00',
                reason: 'examen',
              });
              setIsSubmitted(false);
            }}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors"
          >
            Nouveau rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="px-6 py-8 sm:p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Prendre Rendez-vous</h2>
            <p className="mt-4 text-lg text-gray-500">
              Réservez une consultation avec nos opticiens experts pour un examen de la vue ou des conseils personnalisés.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Horaires disponibles: tous les jours de 8h00 à 17h00, sauf le dimanche et les jours fériés.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom complet</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="focus:ring-purple-700 focus:border-purple-700 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="focus:ring-purple-700 focus:border-purple-700 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motif de consultation</label>
                <div className="mt-1">
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    className="focus:ring-purple-700 focus:border-purple-700 block w-full sm:text-sm border-gray-300 rounded-md py-3 px-3 border bg-white"
                  >
                    <option value="examen">Examen de la vue</option>
                    <option value="conseil">Conseil monture</option>
                    <option value="lentilles">Adaptation lentilles</option>
                    <option value="reparation">Réparation / Ajustement</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date souhaitée</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="focus:ring-purple-700 focus:border-purple-700 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border bg-white"
                  >
                    {availableDates.map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">Heure souhaitée</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="time"
                    id="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="focus:ring-purple-700 focus:border-purple-700 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border bg-white"
                  >
                    {availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Confirmer le rendez-vous'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
