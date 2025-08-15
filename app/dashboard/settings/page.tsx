import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { updateProfileAction, updatePasswordAction, updatePreferredRegionAction } from "@/lib/actions/settings-actions"
import { User, Bell, Shield, Globe, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>
}) {
  const session = await getServerSession()
  const params = await searchParams
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Paramètres du compte
          </h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
            Gérez vos informations personnelles et préférences
          </p>
        </div>


        <div className="space-y-6">
          {/* Profile Information */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <User className="h-5 w-5" />
                Informations personnelles
              </h2>
            </div>
            <div className="p-6">
              <SettingsForm 
                action={updateProfileAction}
                user={session.user}
                type="profile"
              />
            </div>
          </div>

          {/* Regional Preferences */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Globe className="h-5 w-5" />
                Préférences régionales
              </h2>
            </div>
            <div className="p-6">
              <SettingsForm 
                action={updatePreferredRegionAction}
                user={session.user}
                type="region"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Shield className="h-5 w-5" />
                Sécurité
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Changer le mot de passe
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Mettez à jour votre mot de passe pour sécuriser votre compte
                  </p>
                  <SettingsForm 
                    action={updatePasswordAction}
                    user={session.user}
                    type="password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Bell className="h-5 w-5" />
                Préférences de notification
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Notifications par email
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recevez des mises à jour sur votre collection et les nouveautés
                    </p>
                  </div>
                  <button
                    type="button"
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-gray-700"
                    role="switch"
                    aria-checked="false"
                  >
                    <span className="sr-only">Activer les notifications</span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    ></span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Newsletters
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Articles, analyses et découvertes de jeux rétro
                    </p>
                  </div>
                  <button
                    type="button"
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    role="switch"
                    aria-checked="true"
                  >
                    <span className="sr-only">Désactiver les newsletters</span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <User className="h-5 w-5" />
                Confidentialité
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Profil public
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Permettre aux autres utilisateurs de voir votre collection
                    </p>
                  </div>
                  <button
                    type="button"
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:bg-gray-700"
                    role="switch"
                    aria-checked="false"
                  >
                    <span className="sr-only">Rendre le profil public</span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    ></span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Statistiques anonymes
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Contribuer aux statistiques globales du site (données anonymisées)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    role="switch"
                    aria-checked="true"
                  >
                    <span className="sr-only">Désactiver les statistiques</span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <div className="border-b border-red-200 px-6 py-4 dark:border-red-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-red-900 dark:text-red-400">
                <Shield className="h-5 w-5" />
                Zone de danger
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-red-900 dark:text-red-400">
                    Supprimer le compte
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    Cette action est irréversible. Toutes vos données, y compris votre collection et vos évaluations, seront définitivement supprimées.
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}